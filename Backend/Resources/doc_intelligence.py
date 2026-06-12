"""
doc_intelligence.py
────────────────────────────────────────────────────────────────────────────
Zero-Hallucination Document Intelligence Extractor

Reads structured project documents (CSV / XLSX) programmatically — NO LLM
calls — and returns a GroundedFactBase that is used as the authoritative
source of truth for all downstream analysis.

Extraction targets:
  • Master RAID Tracker  (CSV / XLSX)
    Columns: ID | Track | Type | Description | Owner | Date Logged
             | Due for Closure on | Status | Impact | Mitigation
    Types extracted: Risk, Action Item, Decision

  • Track specific action items  (XLSX — multi-sheet)
    Sheets: Quality Management | Supplier Collaboration | Integrations
            | Data migration  (and any other sheets present)
    Columns: Action ID | [Component] | Action Item Description
             | Target Date | Owner

All items carry a `source_file` field pointing to the actual file they
came from so the frontend can trace every data point to its origin.
"""

import os
import csv
import re
from datetime import datetime
from typing import Optional
from openpyxl import load_workbook


# ──────────────────────────────────────────────────────────────────────────
# Type definitions
# ──────────────────────────────────────────────────────────────────────────

GroundedFactBase = dict   # typed alias for clarity in call-sites


# ──────────────────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────────────────

def _clean(val) -> str:
    """Strip whitespace / None values to empty string."""
    return str(val).strip() if val is not None else ""


def _fmt_date(val) -> str:
    """Normalise a raw date value (string or datetime) to YYYY-MM-DD or 'NA'."""
    if val is None:
        return "NA"
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    if not s or s.lower() in ("none", "na", "n/a", ""):
        return "NA"
    # Try common formats
    for fmt in ("%d-%b-%y", "%d-%b-%Y", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return s   # return as-is if no format matched


def _infer_impact(impact_col: str, status_col: str) -> str:
    """
    Map free-text Impact / Status columns to High / Medium / Low.
    Falls back to 'Medium' if nothing recognisable is found.
    """
    combined = (impact_col + " " + status_col).lower()
    if any(w in combined for w in ("high", "critical", "escalat", "discovery", "confidence", "architect")):
        return "High"
    if any(w in combined for w in ("medium", "moderate", "delay", "knowledge", "domain")):
        return "Medium"
    if any(w in combined for w in ("low", "minor")):
        return "Low"
    return "Medium"


def _infer_risk_status(status_col: str) -> str:
    """Map raw RAID status strings to the frontend enum values."""
    s = status_col.lower().strip()
    if s in ("open",):
        return "Open"
    if s in ("closed", "complete", "completed", "done"):
        return "Monitoring"
    if "progress" in s or "in-progress" in s:
        return "In Progress"
    if "escalat" in s:
        return "Escalated"
    return "Open"


def _infer_action_status(status_col: str) -> str:
    """Map raw status to the frontend action status enum."""
    s = status_col.lower().strip()
    if "complete" in s or "done" in s or s == "closed":
        return "Complete"
    if "overdue" in s:
        return "Overdue"
    if "progress" in s:
        return "In Progress"
    return "Not Started"


def _infer_priority_from_id(action_id: str, track: str) -> str:
    """
    Infer priority from the action ID prefix or track label.
    Program-level items default to High; track-specific to Medium.
    """
    aid = action_id.strip().upper()
    trk = track.lower()
    if aid.startswith("A") and re.match(r"^A\d", aid):
        return "High"      # RAID Tracker program actions
    if "program" in trk or "exec" in trk:
        return "High"
    return "Medium"


# ──────────────────────────────────────────────────────────────────────────
# RAID Tracker CSV extractor
# ──────────────────────────────────────────────────────────────────────────

def extract_raid_tracker_csv(file_path: str, source_name: str) -> dict:
    """
    Parse a RAID Tracker CSV file and return structured dicts for
    risks[], actions[], and decisions[].

    Expected columns (case-insensitive header match):
      ID, Track, Type, Description, Owner, Date Logged,
      Due for Closure on, Status, Impact, Mitigation
    """
    risks = []
    actions = []
    decisions = []

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
            reader = csv.DictReader(fh)

            # Normalise header keys (lower-case, strip)
            raw_rows = list(reader)
            if not raw_rows:
                return {"risks": risks, "actions": actions, "decisions": decisions}

            for row in raw_rows:
                # Case-insensitive field access
                row_l = {k.strip().lower(): v for k, v in row.items()}

                item_type  = _clean(row_l.get("type", "")).lower()
                item_id    = _clean(row_l.get("id", ""))
                track      = _clean(row_l.get("track", ""))
                desc       = _clean(row_l.get("description", ""))
                owner      = _clean(row_l.get("owner", "")) or "NA"
                date_log   = _fmt_date(row_l.get("date logged", ""))
                due_date   = _fmt_date(row_l.get("due for closure on", ""))
                status_raw = _clean(row_l.get("status", ""))
                impact_raw = _clean(row_l.get("impact", ""))
                mitigation = _clean(row_l.get("mitigation", "")) or "NA"

                if not desc:
                    continue   # skip blank rows

                if "risk" in item_type:
                    risks.append({
                        "risk": desc,
                        "impact": _infer_impact(impact_raw, status_raw),
                        "probability": _infer_impact(impact_raw, status_raw),  # use same signal
                        "mitigation": mitigation,
                        "owner": owner,
                        "status": _infer_risk_status(status_raw),
                        "due_date": due_date,
                        "source_file": source_name,
                        "_id": item_id,
                        "_track": track,
                    })

                elif "action" in item_type:
                    actions.append({
                        "action": desc,
                        "owner": owner,
                        "due_date": due_date,
                        "status": _infer_action_status(status_raw),
                        "priority": _infer_priority_from_id(item_id, track),
                        "age_days": 0,   # computed later if needed
                        "source_file": source_name,
                        "_id": item_id,
                        "_track": track,
                    })

                elif "decision" in item_type:
                    decisions.append({
                        "decision": desc,
                        "date": date_log,
                        "status": _infer_action_status(status_raw),
                        "source_file": source_name,
                        "_id": item_id,
                    })

    except Exception as e:
        print(f"[DocIntelligence] Error reading RAID CSV '{file_path}': {e}")

    return {"risks": risks, "actions": actions, "decisions": decisions}


# ──────────────────────────────────────────────────────────────────────────
# RAID Tracker XLSX extractor  (same columns as CSV, read via openpyxl)
# ──────────────────────────────────────────────────────────────────────────

def extract_raid_tracker_xlsx(file_path: str, source_name: str) -> dict:
    """Parse a RAID Tracker stored as an Excel workbook (first sheet assumed)."""
    risks = []
    actions = []
    decisions = []

    try:
        wb = load_workbook(file_path, read_only=True, data_only=True)
        ws = wb.active
        all_rows = list(ws.iter_rows(values_only=True))
        if len(all_rows) < 2:
            return {"risks": risks, "actions": actions, "decisions": decisions}

        # Map header names → column indices
        header = [_clean(c).lower() for c in all_rows[0]]

        def col(name: str):
            return next((i for i, h in enumerate(header) if name in h), None)

        idx_type   = col("type")
        idx_id     = col("id")
        idx_track  = col("track")
        idx_desc   = col("description")
        idx_owner  = col("owner")
        idx_due    = col("due")
        idx_log    = col("date logged")
        idx_status = col("status")
        idx_impact = col("impact")
        idx_mit    = col("mitigation")

        for raw in all_rows[1:]:
            def g(idx):
                return _clean(raw[idx]) if idx is not None and idx < len(raw) else ""

            item_type  = g(idx_type).lower()
            item_id    = g(idx_id)
            track      = g(idx_track)
            desc       = g(idx_desc)
            owner      = g(idx_owner) or "NA"
            due_date   = _fmt_date(raw[idx_due] if idx_due is not None else None)
            status_raw = g(idx_status)
            impact_raw = g(idx_impact)
            mitigation = g(idx_mit) or "NA"

            if not desc:
                continue

            if "risk" in item_type:
                risks.append({
                    "risk": desc,
                    "impact": _infer_impact(impact_raw, status_raw),
                    "probability": _infer_impact(impact_raw, status_raw),
                    "mitigation": mitigation,
                    "owner": owner,
                    "status": _infer_risk_status(status_raw),
                    "due_date": due_date,
                    "source_file": source_name,
                    "_id": item_id,
                    "_track": track,
                })
            elif "action" in item_type:
                actions.append({
                    "action": desc,
                    "owner": owner,
                    "due_date": due_date,
                    "status": _infer_action_status(status_raw),
                    "priority": _infer_priority_from_id(item_id, track),
                    "age_days": 0,
                    "source_file": source_name,
                    "_id": item_id,
                    "_track": track,
                })
            elif "decision" in item_type:
                decisions.append({
                    "decision": desc,
                    "date": _fmt_date(raw[idx_log] if idx_log is not None else None),
                    "status": _infer_action_status(status_raw),
                    "source_file": source_name,
                    "_id": item_id,
                })

    except Exception as e:
        print(f"[DocIntelligence] Error reading RAID XLSX '{file_path}': {e}")

    return {"risks": risks, "actions": actions, "decisions": decisions}


# ──────────────────────────────────────────────────────────────────────────
# Track-specific action items XLSX (multi-sheet)
# ──────────────────────────────────────────────────────────────────────────

def extract_action_items_xlsx(file_path: str, source_name: str) -> list:
    """
    Parse a multi-sheet 'Track specific action items' workbook.
    Each sheet may have columns:
      Action ID | [Component] | Action Item Description | Target Date | Owner

    Returns a flat list of action dicts.
    """
    actions = []
    try:
        wb = load_workbook(file_path, read_only=True, data_only=True)
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            all_rows = list(ws.iter_rows(values_only=True))
            if len(all_rows) < 2:
                continue

            header = [_clean(c).lower() for c in all_rows[0]]

            def col(name: str):
                return next((i for i, h in enumerate(header) if name in h), None)

            idx_id    = col("action id")
            idx_desc  = col("description")         # "Action Item Description"
            idx_date  = col("target date")
            idx_owner = col("owner")
            # Some sheets have a 'Component' column — we'll just ignore it

            # If no description column found, fall back to column index 1 or 2
            if idx_desc is None:
                idx_desc = 2 if len(header) > 2 else 1

            for raw in all_rows[1:]:
                def g(idx):
                    return _clean(raw[idx]) if idx is not None and idx < len(raw) else ""

                action_id = g(idx_id)
                desc      = g(idx_desc)
                due_date  = _fmt_date(raw[idx_date] if idx_date is not None and idx_date < len(raw) else None)
                owner     = g(idx_owner) or "NA"

                if not desc:
                    continue

                actions.append({
                    "action": desc,
                    "owner": owner,
                    "due_date": due_date,
                    "status": "Not Started",      # no status column in this file
                    "priority": _infer_priority_from_id(action_id, sheet_name),
                    "age_days": 0,
                    "source_file": source_name,
                    "_id": action_id,
                    "_track": sheet_name,
                })

    except Exception as e:
        print(f"[DocIntelligence] Error reading action items XLSX '{file_path}': {e}")

    return actions


# ──────────────────────────────────────────────────────────────────────────
# Master orchestrator
# ──────────────────────────────────────────────────────────────────────────

def build_grounded_fact_base(project_dir: str, known_files: list) -> GroundedFactBase:
    """
    Scan the project directory for all structured files (CSV / XLSX) and
    extract a GroundedFactBase — the authoritative, LLM-free source of
    truth for risks, actions, and decisions.

    Returns:
    {
        "risks":    [ ... ],     # from RAID Tracker
        "actions":  [ ... ],     # from RAID Tracker + Track-specific XLSX
        "decisions": [ ... ],    # from RAID Tracker
        "source_files_scanned": [ ... ]
    }
    """
    fact_base: GroundedFactBase = {
        "risks": [],
        "actions": [],
        "decisions": [],
        "source_files_scanned": [],
    }

    if not project_dir or not os.path.isdir(project_dir):
        print(f"[DocIntelligence] Project dir not found: {project_dir}")
        return fact_base

    all_files = os.listdir(project_dir)
    print(f"[DocIntelligence] Scanning {len(all_files)} files in: {project_dir}")

    for fname in all_files:
        fpath = os.path.join(project_dir, fname)
        if not os.path.isfile(fpath):
            continue

        ext  = os.path.splitext(fname.lower())[1]
        name = fname.lower()

        # ── RAID Tracker ─────────────────────────────────────────────────
        if "raid" in name and ext == ".csv":
            print(f"[DocIntelligence] Extracting RAID CSV: {fname}")
            result = extract_raid_tracker_csv(fpath, fname)
            fact_base["risks"].extend(result["risks"])
            fact_base["actions"].extend(result["actions"])
            fact_base["decisions"].extend(result["decisions"])
            fact_base["source_files_scanned"].append(fname)

        elif "raid" in name and ext == ".xlsx":
            print(f"[DocIntelligence] Extracting RAID XLSX: {fname}")
            result = extract_raid_tracker_xlsx(fpath, fname)
            fact_base["risks"].extend(result["risks"])
            fact_base["actions"].extend(result["actions"])
            fact_base["decisions"].extend(result["decisions"])
            fact_base["source_files_scanned"].append(fname)

        # ── Track-specific action items ──────────────────────────────────
        elif ("action" in name or "track" in name) and ext == ".xlsx" and "raid" not in name:
            print(f"[DocIntelligence] Extracting Track Action Items XLSX: {fname}")
            extra_actions = extract_action_items_xlsx(fpath, fname)
            fact_base["actions"].extend(extra_actions)
            fact_base["source_files_scanned"].append(fname)

    _dedup_inplace(fact_base["risks"],    key="risk")
    _dedup_inplace(fact_base["actions"],  key="action")
    _dedup_inplace(fact_base["decisions"], key="decision")

    print(
        f"[DocIntelligence] GroundedFactBase built: "
        f"{len(fact_base['risks'])} risks | "
        f"{len(fact_base['actions'])} actions | "
        f"{len(fact_base['decisions'])} decisions"
    )
    return fact_base


# ──────────────────────────────────────────────────────────────────────────
# Post-LLM validation & merge
# ──────────────────────────────────────────────────────────────────────────

def validate_llm_items(
    llm_items: list,
    known_source_files: list,
    grounded_items: list,
    text_field: str = "risk",
) -> list:
    """
    Filter LLM-generated items, keeping only those that:
      1. Have a non-NA source_file that actually exists in known_source_files
      2. Are NOT duplicates of already-grounded items (similarity check)

    Returns only VERIFIED LLM additions (not the grounded items themselves).
    """
    if not llm_items:
        return []

    # Normalised set of real file names (lower-case) for fast lookup
    known_lower = {f.lower() for f in known_source_files}

    # Pre-build normalised descriptions of grounded items for dedup
    grounded_texts = {
        _normalise_text(item.get(text_field, ""))
        for item in grounded_items
        if item.get(text_field)
    }

    verified = []
    for item in llm_items:
        src = item.get("source_file", "NA")
        desc = item.get(text_field, "")

        # Rule 1: Must have a traceable source file
        if not src or src.strip().upper() == "NA":
            print(f"[DocIntelligence Validation] Dropped (no source): {desc[:80]}")
            continue

        # Rule 2: Source file must be a real file we know about
        if src.lower() not in known_lower:
            print(f"[DocIntelligence Validation] Dropped (unknown source '{src}'): {desc[:80]}")
            continue

        # Rule 3: Must not duplicate a grounded item
        norm = _normalise_text(desc)
        if any(_similarity(norm, g) > 0.70 for g in grounded_texts):
            print(f"[DocIntelligence Validation] Dropped (duplicate of grounded): {desc[:80]}")
            continue

        verified.append(item)
        grounded_texts.add(norm)   # prevent LLM self-duplicates too

    return verified


# ──────────────────────────────────────────────────────────────────────────
# Internal helpers for dedup and similarity
# ──────────────────────────────────────────────────────────────────────────

def _normalise_text(text: str) -> str:
    """Lowercase, remove punctuation, collapse whitespace for comparison."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _similarity(a: str, b: str) -> float:
    """
    Jaccard similarity on word sets.
    Fast and good enough for deduplication (no external dependencies).
    """
    if not a or not b:
        return 0.0
    set_a = set(a.split())
    set_b = set(b.split())
    if not set_a and not set_b:
        return 1.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union)


def _dedup_inplace(items: list, key: str) -> None:
    """Remove duplicates from a list of dicts in-place using the given key field."""
    seen = set()
    to_remove = []
    for i, item in enumerate(items):
        norm = _normalise_text(item.get(key, ""))
        if norm in seen:
            to_remove.append(i)
        else:
            seen.add(norm)
    for i in reversed(to_remove):
        items.pop(i)
