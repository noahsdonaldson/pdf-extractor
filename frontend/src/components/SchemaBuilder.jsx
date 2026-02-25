import { useMemo } from 'react'

const FIELD_TYPE_OPTIONS = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Object', value: 'object' },
  { label: 'List', value: 'list' },
]

function createNodeByType(type) {
  if (type === 'object') {
    return { type: 'object', properties: {} }
  }

  if (type === 'list') {
    return { type: 'list', items: { type: 'object', properties: {} } }
  }

  return { type }
}

function getNode(schema, path) {
  let current = schema
  for (const step of path) {
    if (!current) {
      return null
    }

    if (step === '__items') {
      current = current.items
      continue
    }

    current = current.properties?.[step]
  }
  return current
}

export default function SchemaBuilder({ schema, onChange }) {
  const totalFieldCount = useMemo(() => {
    const walk = (node) => {
      if (!node || node.type !== 'object') {
        return 0
      }

      return Object.values(node.properties || {}).reduce((count, child) => {
        if (child.type === 'object') {
          return count + 1 + walk(child)
        }
        if (child.type === 'list') {
          return count + 1 + walk(child.items)
        }
        return count + 1
      }, 0)
    }

    return walk(schema)
  }, [schema])

  const addField = (objectPath) => {
    const next = structuredClone(schema)
    const targetObject = getNode(next, objectPath)
    if (!targetObject || targetObject.type !== 'object') {
      return
    }

    let index = 1
    let candidate = `field_${index}`
    while (targetObject.properties[candidate]) {
      index += 1
      candidate = `field_${index}`
    }

    targetObject.properties[candidate] = { type: 'string' }
    onChange(next)
  }

  const removeField = (objectPath, fieldName) => {
    const next = structuredClone(schema)
    const targetObject = getNode(next, objectPath)
    if (!targetObject || targetObject.type !== 'object') {
      return
    }

    delete targetObject.properties[fieldName]
    onChange(next)
  }

  const renameField = (objectPath, oldName, newName) => {
    const cleaned = newName.trim()
    if (!cleaned || cleaned === oldName) {
      return
    }

    const next = structuredClone(schema)
    const targetObject = getNode(next, objectPath)
    if (!targetObject || targetObject.type !== 'object') {
      return
    }

    if (targetObject.properties[cleaned]) {
      return
    }

    const oldValue = targetObject.properties[oldName]
    delete targetObject.properties[oldName]
    targetObject.properties[cleaned] = oldValue
    onChange(next)
  }

  const updateFieldType = (objectPath, fieldName, nextType) => {
    const next = structuredClone(schema)
    const targetObject = getNode(next, objectPath)
    if (!targetObject || targetObject.type !== 'object') {
      return
    }

    targetObject.properties[fieldName] = createNodeByType(nextType)
    onChange(next)
  }

  const updateListItemType = (listPath, itemType) => {
    const next = structuredClone(schema)
    const listNode = getNode(next, listPath)
    if (!listNode || listNode.type !== 'list') {
      return
    }

    listNode.items = createNodeByType(itemType)
    onChange(next)
  }

  const renderObjectEditor = (nodePath, title) => {
    const node = getNode(schema, nodePath)
    if (!node || node.type !== 'object') {
      return null
    }

    const entries = Object.entries(node.properties || {})

    return (
      <div className="rounded-md border border-slate-300 bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
          <button
            type="button"
            onClick={() => addField(nodePath)}
            className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white"
          >
            Add Field
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-xs text-slate-500">No fields yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map(([fieldName, fieldSchema]) => (
              <div key={`${nodePath.join('.')}:${fieldName}`} className="rounded-md border border-slate-200 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    defaultValue={fieldName}
                    onBlur={(event) => renameField(nodePath, fieldName, event.target.value)}
                    className="min-w-[150px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />

                  <select
                    value={fieldSchema.type}
                    onChange={(event) => updateFieldType(nodePath, fieldName, event.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {FIELD_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeField(nodePath, fieldName)}
                    className="rounded-md border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
                  >
                    Remove
                  </button>
                </div>

                {fieldSchema.type === 'object' && (
                  <div className="mt-3 pl-3">
                    {renderObjectEditor([...nodePath, fieldName], `${fieldName} Fields`)}
                  </div>
                )}

                {fieldSchema.type === 'list' && (
                  <div className="mt-3 space-y-2 pl-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-600">List Item Type</label>
                      <select
                        value={fieldSchema.items?.type || 'string'}
                        onChange={(event) => updateListItemType([...nodePath, fieldName], event.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      >
                        {FIELD_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {fieldSchema.items?.type === 'object' && renderObjectEditor([...nodePath, fieldName, '__items'], `${fieldName} Item Fields`)}
                    {fieldSchema.items?.type === 'list' && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                        Nested list configured. Select inner item type and fields recursively.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Schema Builder</h3>
        <span className="text-xs text-slate-500">{totalFieldCount} fields</span>
      </div>
      {renderObjectEditor([], 'Root Object')}
    </section>
  )
}
