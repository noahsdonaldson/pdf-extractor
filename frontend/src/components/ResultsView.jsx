function tokenizePath(path) {
  const tokens = []
  const pattern = /([^[.\]]+)|\[(\d+)\]/g
  let match = pattern.exec(path)

  while (match) {
    if (match[1]) {
      tokens.push(match[1])
    } else if (match[2]) {
      tokens.push(Number(match[2]))
    }
    match = pattern.exec(path)
  }

  return tokens
}

function getValueByPath(data, path) {
  if (!data || !path) {
    return undefined
  }

  const tokens = tokenizePath(path)
  return tokens.reduce((current, token) => {
    if (current == null) {
      return undefined
    }
    return current[token]
  }, data)
}

export default function ResultsView({
  resultData,
  fieldMatches,
  activePath,
  onSelectPath,
  onClearSelection,
  loading,
  error,
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4" onClick={(event) => event.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Results</h3>
        <button
          type="button"
          onClick={onClearSelection}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          Clear Highlight
        </button>
      </div>

      {loading && (
        <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Extracting with LLM... this can take a moment.
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {resultData ? (
        <pre className="mb-3 max-h-44 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify(resultData, null, 2)}
        </pre>
      ) : (
        <p className="mb-3 text-xs text-slate-500">Run extraction to view data and coordinate matches.</p>
      )}

      <div className="space-y-2">
        {fieldMatches.length === 0 ? (
          <p className="text-xs text-slate-500">No coordinate matches available yet.</p>
        ) : (
          fieldMatches.map((item, index) => {
            const extractedValue = getValueByPath(resultData, item.path)

            return (
              <button
                key={`${item.path}-${index}`}
                type="button"
                data-result-item="true"
                onClick={() => onSelectPath(item.path)}
                className={`block w-full rounded-md border px-2 py-2 text-left text-xs ${
                  activePath === item.path
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">{item.path}</div>
                <div className="text-slate-600">Value: {String(extractedValue ?? '(not found)')}</div>
                <div className="text-slate-600">Page {item.page} • Score {Math.round(item.score)}</div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
