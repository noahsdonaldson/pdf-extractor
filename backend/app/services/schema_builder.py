from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, create_model

SCALAR_TYPES = {"string", "number", "integer", "boolean"}


def build_response_model_from_schema(
    json_schema: dict[str, Any],
    model_name: str = "ExtractionResponseModel",
) -> type[BaseModel]:
    properties = _get_object_properties(json_schema)
    return _build_object_model(model_name, properties)


def _build_object_model(model_name: str, properties: dict[str, Any]) -> type[BaseModel]:
    fields: dict[str, tuple[Any, Any]] = {}

    for field_name, field_schema in properties.items():
        normalized = _normalize_schema_node(field_schema)
        field_type = _get_field_type(normalized)

        if field_type == "object":
            nested_properties = _get_object_properties(normalized)
            nested_model = _build_object_model(
                f"{model_name}_{_pascal_case(field_name)}",
                nested_properties,
            )
            fields[field_name] = (nested_model, ...)
            continue

        if field_type == "list":
            list_type = _build_list_type(model_name, field_name, normalized)
            fields[field_name] = (list_type, ...)

            item_schema = _normalize_schema_node(_get_list_item_schema(normalized))
            item_type = _get_field_type(item_schema)
            if item_type in SCALAR_TYPES:
                fields[f"{field_name}_context"] = (list[str], ...)
            continue

        python_type = _map_scalar_type(field_type)
        fields[field_name] = (python_type, ...)
        fields[f"{field_name}_context"] = (str, ...)

    fields["_context_snippet"] = (str | None, None)

    return create_model(
        model_name,
        __config__=ConfigDict(extra="forbid"),
        **fields,
    )


def _build_list_type(model_name: str, field_name: str, schema_node: dict[str, Any]) -> Any:
    item_schema = _normalize_schema_node(_get_list_item_schema(schema_node))
    item_type = _get_field_type(item_schema)

    if item_type == "object":
        nested_model = _build_object_model(
            f"{model_name}_{_pascal_case(field_name)}Item",
            _get_object_properties(item_schema),
        )
        return list[nested_model]

    if item_type == "list":
        inner_list_type = _build_list_type(model_name, f"{field_name}Nested", item_schema)
        return list[inner_list_type]

    scalar_type = _map_scalar_type(item_type)
    return list[scalar_type]


def _get_object_properties(schema_node: dict[str, Any]) -> dict[str, Any]:
    if "properties" in schema_node and isinstance(schema_node["properties"], dict):
        return schema_node["properties"]

    if "fields" in schema_node and isinstance(schema_node["fields"], dict):
        return schema_node["fields"]

    if "type" in schema_node and _get_field_type(schema_node) == "object":
        return {}

    return {
        key: value
        for key, value in schema_node.items()
        if key not in {"type", "name", "description", "title", "required"}
    }


def _get_list_item_schema(schema_node: dict[str, Any]) -> Any:
    return (
        schema_node.get("items")
        or schema_node.get("item")
        or schema_node.get("item_schema")
        or schema_node.get("itemSchema")
        or {"type": "string"}
    )


def _normalize_schema_node(schema_node: Any) -> dict[str, Any]:
    if isinstance(schema_node, str):
        return {"type": schema_node}

    if isinstance(schema_node, dict):
        return schema_node

    return {"type": "string"}


def _get_field_type(schema_node: dict[str, Any]) -> str:
    raw_type = str(schema_node.get("type", "object")).lower()
    alias_map = {
        "str": "string",
        "float": "number",
        "int": "integer",
        "bool": "boolean",
        "array": "list",
    }
    return alias_map.get(raw_type, raw_type)


def _map_scalar_type(field_type: str) -> type[str] | type[float] | type[int] | type[bool]:
    if field_type == "string":
        return str
    if field_type == "number":
        return float
    if field_type == "integer":
        return int
    if field_type == "boolean":
        return bool
    return str


def _pascal_case(value: str) -> str:
    chunks = [chunk for chunk in value.replace("_", " ").replace("-", " ").split(" ") if chunk]
    return "".join(chunk[:1].upper() + chunk[1:] for chunk in chunks) or "Field"
