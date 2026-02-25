from __future__ import annotations

from typing import Any

from rapidfuzz import fuzz, process

from app.models.extract import FieldMatch
from app.models.pdf_index import TextBlock


def map_extraction_to_coordinates(
    extracted_data: dict[str, Any],
    token_map: list[TextBlock],
    min_score: float = 55,
) -> list[FieldMatch]:
    matches: list[FieldMatch] = []
    _walk_context_fields(
        value=extracted_data,
        path="",
        token_map=token_map,
        matches=matches,
        min_score=min_score,
    )
    return matches


def _walk_context_fields(
    *,
    value: Any,
    path: str,
    token_map: list[TextBlock],
    matches: list[FieldMatch],
    min_score: float,
) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = f"{path}.{key}" if path else key

            if key.endswith("_context"):
                base_path = child_path[: -len("_context")]
                _match_context_value(base_path, child, token_map, matches, min_score)
                continue

            if key == "_context_snippet":
                _match_context_value(path or "_context_snippet", child, token_map, matches, min_score)
                continue

            _walk_context_fields(
                value=child,
                path=child_path,
                token_map=token_map,
                matches=matches,
                min_score=min_score,
            )
        return

    if isinstance(value, list):
        for index, item in enumerate(value):
            item_path = f"{path}[{index}]"
            _walk_context_fields(
                value=item,
                path=item_path,
                token_map=token_map,
                matches=matches,
                min_score=min_score,
            )


def _match_context_value(
    base_path: str,
    context_value: Any,
    token_map: list[TextBlock],
    matches: list[FieldMatch],
    min_score: float,
) -> None:
    if isinstance(context_value, str):
        matched = _best_block_for_snippet(context_value, token_map, min_score)
        if matched is not None:
            matches.append(_to_field_match(base_path, context_value, matched))
        return

    if isinstance(context_value, list):
        for index, snippet in enumerate(context_value):
            if not isinstance(snippet, str):
                continue
            matched = _best_block_for_snippet(snippet, token_map, min_score)
            if matched is None:
                continue
            matches.append(_to_field_match(f"{base_path}[{index}]", snippet, matched))


def _best_block_for_snippet(
    snippet: str,
    token_map: list[TextBlock],
    min_score: float,
) -> tuple[TextBlock, float] | None:
    cleaned_snippet = snippet.strip()
    if not cleaned_snippet or not token_map:
        return None

    choices = [block.text for block in token_map]
    best = process.extractOne(cleaned_snippet, choices, scorer=fuzz.token_set_ratio)
    if best is None:
        return None

    _, score, index = best
    if float(score) < min_score:
        return None

    return token_map[index], float(score)


def _to_field_match(path: str, snippet: str, matched: tuple[TextBlock, float]) -> FieldMatch:
    block, score = matched
    return FieldMatch(
        path=path,
        snippet=snippet,
        matched_text=block.text,
        score=score,
        page=block.page,
        x0=block.x0,
        y0=block.y0,
        x1=block.x1,
        y1=block.y1,
        block_index=block.block_index,
    )
