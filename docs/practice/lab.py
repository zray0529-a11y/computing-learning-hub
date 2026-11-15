#!/usr/bin/env python3
"""Six offline lessons. Fictional data, one simulated clock, no file writes."""
import argparse
import json
import sqlite3

NOW = 1000
TTL = 600
ALLOWED = {"zone-a", "zone-old", "zone-future", "zone-missing",
           "zone-edge", "zone-conflict"}


def show(label, value):
    print(label + " = " + json.dumps(value, ensure_ascii=False, sort_keys=True))


def event(event_id, entity_id, observed_at, state):
    return {"event_id": event_id, "camera_id": "camera-sim-1",
            "entity_id": entity_id, "observed_at": observed_at, "state": state}


def fixture():
    newest = event("e2", "zone-a", 900, "occupied")
    return [
        event("e1", "zone-a", 500, "clear"), newest, dict(newest),
        event("e0", "zone-a", 450, "clear"),  # Arrives after the newer event.
        event("e-old", "zone-old", 399, "occupied"),
        event("e-future", "zone-future", 1001, "clear"),
        event("e-private", "zone-secret", 990, "occupied"),
        event("e-edge", "zone-edge", 400, "clear"),
        event("e-c1", "zone-conflict", 950, "clear"),
        event("e-c2", "zone-conflict", 950, "occupied"),
        event("e-missing", "zone-missing", None, "clear"),
    ]


def valid_event(row):
    if not isinstance(row, dict):
        return False
    ids = ("event_id", "camera_id", "entity_id")
    return (all(isinstance(row.get(k), str) and row[k].strip() for k in ids)
            and type(row.get("observed_at")) is int
            and row["observed_at"] >= 0
            and row.get("state") in ("clear", "occupied"))


def build_index(rows):
    """A repeated ID has one effect; conflicting payloads quarantine that ID."""
    index = {}
    counts = {"duplicates": 0, "conflicts": 0, "invalid": 0}
    for row in rows:
        if not valid_event(row):
            counts["invalid"] += 1
            continue
        key = row["event_id"]
        if key not in index:
            index[key] = dict(row)
        elif index[key] == row:
            counts["duplicates"] += 1
        else:
            index[key] = None  # Never silently choose a conflicting payload.
            counts["conflicts"] += 1
    return index, counts


def fresh_rows(index, entity_id, now=NOW, ttl=TTL):
    return [row for row in index.values()
            if row is not None and row["entity_id"] == entity_id
            and 0 <= now - row["observed_at"] <= ttl]


def latest_observation(index, entity_id, allowed, now=NOW, ttl=TTL):
    if entity_id not in allowed:  # Check access before examining the resource.
        return {"status": "denied"}
    rows = fresh_rows(index, entity_id, now, ttl)
    if not rows:
        return {"status": "unknown", "reason": "no_fresh_observation"}
    newest = max(row["observed_at"] for row in rows)
    latest = [row for row in rows if row["observed_at"] == newest]
    evidence = sorted(row["event_id"] for row in latest)
    states = {row["state"] for row in latest}
    if len(states) != 1:
        return {"status": "unknown", "reason": "conflicting_observations",
                "evidence_ids": evidence}
    return {"status": "observed", "observed_state": latest[0]["state"],
            "observed_at": newest, "as_of": now, "evidence_ids": evidence}


def retrieve(index, entity_id, keyword, allowed, now=NOW, ttl=TTL):
    """Literal keyword retrieval: no embeddings, LLM, or RAG evaluation."""
    if entity_id not in allowed:
        return {"status": "denied", "hits": []}
    rows = fresh_rows(index, entity_id, now, ttl)
    rows.sort(key=lambda row: (-row["observed_at"], row["event_id"]))
    hits = [row["event_id"] for row in rows
            if keyword.casefold() in (row["entity_id"] + " " + row["state"]).casefold()]
    return {"status": "matches" if hits else "unknown", "hits": hits}


def evidence_ok(claim, index, entity_id, allowed):
    expected = latest_observation(index, entity_id, allowed)
    keys = ("observed_state", "observed_at", "evidence_ids")
    return (claim.get("status") == expected.get("status") == "observed"
            and bool(claim.get("evidence_ids"))
            and all(claim.get(key) == expected.get(key) for key in keys))


def workflow(index, entity_id, allowed, budget=2, timeouts=0, strip_evidence=False):
    """A bounded deterministic workflow; returns a proposal, never an action."""
    if entity_id not in allowed:
        return {"status": "denied", "attempts": 0}
    if type(budget) is not int or budget < 0:
        raise ValueError("budget must be a non-negative integer")
    for attempt in range(1, budget + 1):
        if attempt <= timeouts:  # Simulated failure: no network or waiting.
            continue
        claim = latest_observation(index, entity_id, allowed)
        if claim["status"] != "observed":
            return dict(claim, attempts=attempt)
        if strip_evidence:
            claim["evidence_ids"] = []
        if not evidence_ok(claim, index, entity_id, allowed):
            return {"status": "unknown", "reason": "insufficient_evidence",
                    "attempts": attempt}
        return {"status": "ready_for_review", "attempts": attempt,
                "proposal": "review_observation",
                "observed_state": claim["observed_state"],
                "observed_at": claim["observed_at"],
                "evidence_ids": claim["evidence_ids"]}
    return {"status": "unknown", "reason": "budget_exhausted", "attempts": budget}


def lesson1():
    text = '{"camera_id":"cam-a","label":"东门","online":true}'
    parsed = json.loads(text)
    label = parsed["label"]
    rows = [parsed, {"camera_id": "cam-b", "online": False},
            {"camera_id": "cam-c", "online": "false"}, {"camera_id": "cam-d"}]
    valid = [row for row in rows if type(row.get("online")) is bool]
    show("label_chars", len(label))
    show("label_utf8_bytes", len(label.encode("utf-8")))
    show("roundtrip", label.encode("utf-8").decode("utf-8") == label)
    show("online_ids", [row["camera_id"] for row in valid if row["online"]])
    show("invalid_ids", [row["camera_id"] for row in rows if row not in valid])


def lesson2():
    first = event("e1", "zone-a", 500, "clear")
    second = event("e2", "zone-a", 900, "occupied")
    index, counts = build_index([first, dict(first), second])
    show("event_ids", sorted(key for key, row in index.items() if row is not None))
    show("effect_count", sum(row is not None for row in index.values()))
    show("duplicates_ignored", counts["duplicates"])
    conflict, counts = build_index([first, dict(first, state="occupied")])
    show("id_conflicts", counts["conflicts"])
    show("conflict_result", latest_observation(conflict, "zone-a", ALLOWED))


def lesson3():
    con = sqlite3.connect(":memory:", isolation_level=None)
    try:
        con.execute("CREATE TABLE events(event_id TEXT PRIMARY KEY, entity_id TEXT)")
        con.execute("INSERT INTO events VALUES (?, ?)", ("e1", "zone-a"))
        rolled_back = False
        try:
            con.execute("BEGIN")
            con.execute("INSERT INTO events VALUES (?, ?)", ("e2", "zone-a"))
            con.execute("INSERT INTO events VALUES (?, ?)", ("e1", "zone-a"))
            con.execute("COMMIT")
        except sqlite3.IntegrityError:
            con.execute("ROLLBACK")
            rolled_back = True
        query = "SELECT event_id FROM events WHERE entity_id = ? ORDER BY event_id"
        show("transaction_rolled_back", rolled_back)
        show("row_count", con.execute("SELECT COUNT(*) FROM events").fetchone()[0])
        show("normal_query", [row[0] for row in con.execute(query, ("zone-a",))])
        attack_text = "zone-a' OR 1=1 --"
        show("injection_text_query", list(con.execute(query, (attack_text,))))
    finally:
        con.close()


def lesson4():
    index, counts = build_index(fixture())
    show("duplicates_ignored", counts["duplicates"])
    show("invalid_events", counts["invalid"])
    for entity_id in ("zone-a", "zone-old", "zone-future", "zone-missing",
                      "zone-edge", "zone-conflict"):
        show(entity_id, latest_observation(index, entity_id, ALLOWED))


def lesson5():
    index, _ = build_index(fixture())
    cases = [("fresh", "zone-a", "occupied"), ("stale", "zone-old", "occupied"),
             ("future", "zone-future", "clear"), ("denied", "zone-secret", "occupied"),
             ("wrong_entity", "zone-edge", "occupied"),
             ("older_matches", "zone-a", "clear")]
    for label, entity_id, keyword in cases:
        show(label, retrieve(index, entity_id, keyword, ALLOWED))
    show("latest_observed_state", latest_observation(index, "zone-a", ALLOWED)["observed_state"])


def lesson6():
    index, _ = build_index(fixture())
    show("retry_then_success", workflow(index, "zone-a", ALLOWED, timeouts=1))
    show("retry_stops", workflow(index, "zone-a", ALLOWED, timeouts=3))
    show("missing_evidence", workflow(index, "zone-a", ALLOWED, strip_evidence=True))
    show("missing_observation", workflow(index, "zone-missing", ALLOWED))
    show("denied", workflow(index, "zone-secret", ALLOWED))
    show("zero_budget", workflow(index, "zone-a", ALLOWED, budget=0))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson", choices=["all", "1", "2", "3", "4", "5", "6"],
                        default="all", help="Run one lesson, or all (default).")
    args = parser.parse_args()
    lessons = [lesson1, lesson2, lesson3, lesson4, lesson5, lesson6]
    selected = range(1, 7) if args.lesson == "all" else [int(args.lesson)]
    for number in selected:
        print("\n=== Lesson " + str(number) + " ===")
        lessons[number - 1]()


if __name__ == "__main__":
    main()
