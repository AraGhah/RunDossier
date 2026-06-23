"""Unit tests for load_pilot_contacts. No network; transport is injected."""
import sys
from pathlib import Path
from datetime import date

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import load_pilot_contacts as L  # noqa: E402


# ---- pure helpers ---------------------------------------------------------
def test_clean_str_variants():
    assert L.clean_str("  hi ") == "hi"
    assert L.clean_str("") is None
    assert L.clean_str(None) is None
    assert L.clean_str(float("nan")) is None
    assert L.clean_str(5) == "5"


def test_normalize_and_validate_email():
    assert L.normalize_email("  ARA@Preframe.IO ") == "ara@preframe.io"
    assert L.normalize_email("   ") is None
    assert L.is_valid_email("a@b.co")
    assert not L.is_valid_email("nope")
    assert not L.is_valid_email("a@b")
    assert not L.is_valid_email("a b@c.com")


@pytest.mark.parametrize("header,expected", [
    ("Name", "name"),
    ("LinkedIn URL", "profile_url"),
    ("Warmth (1-5)", "warmth"),
    ("Replied (date)", "first_reply_at"),
    ("reply_sentiment", "reply_sentiment"),
    ("Totally Unknown", None),
    ("", None),
])
def test_normalize_header(header, expected):
    assert L.normalize_header(header) == expected


def test_coerce_warmth():
    assert L.coerce_warmth("3") == 3
    assert L.coerce_warmth(4.0) == 4
    assert L.coerce_warmth("") is None
    for bad in ("0", "6", "abc"):
        with pytest.raises(L.ValidationError):
            L.coerce_warmth(bad)


def test_coerce_date():
    assert L.coerce_date(date(2026, 6, 22), "d").startswith("2026-06-22")
    assert L.coerce_date("2026-06-22", "d").startswith("2026-06-22")
    assert L.coerce_date("06/22/2026", "d").startswith("2026-06-22")
    assert L.coerce_date("", "d") is None
    with pytest.raises(L.ValidationError):
        L.coerce_date("not-a-date", "d")


def test_check_enum():
    assert L._check_enum("BOTH", L.ALLOWED_CHANNEL, "channel") == "both"
    assert L._check_enum(None, L.ALLOWED_CHANNEL, "channel") is None
    with pytest.raises(L.ValidationError):
        L._check_enum("fax", L.ALLOWED_CHANNEL, "channel")


# ---- row_to_payload -------------------------------------------------------
def test_row_to_payload_valid_full():
    row = {
        "name": "Jordan Lee", "email": "Jordan@Acme.com", "company": "Acme",
        "persona": "agency_founder", "channel": "both", "warmth": "5",
        "status": "contacted", "contacted_at": "2026-06-22",
        "reply_sentiment": "positive", "outcome": "replied",
        "profile_url": "https://linkedin.com/in/jordan", "message_variant": "A",
    }
    p = L.row_to_payload(row, default_owner="ara")
    assert p["email"] == "jordan@acme.com"   # normalized
    assert p["warmth"] == 5
    assert p["status"] == "contacted"
    assert p["owner"] == "ara"               # default applied
    assert p["contacted_at"].startswith("2026-06-22")


def test_row_to_payload_blank_returns_empty():
    assert L.row_to_payload({"name": "", "email": ""}, None) == {}
    assert L.row_to_payload({"name": None}, None) == {}


def test_row_to_payload_persona_scaffold_skipped():
    # prefilled persona/variant but no contact yet -> skip, not error
    row = {"persona": "agency_founder", "message_variant": "A",
           "channel": "both", "status": "new", "owner": "ara"}
    assert L.row_to_payload(row, None) == {}


def test_row_to_payload_missing_email():
    with pytest.raises(L.ValidationError):
        L.row_to_payload({"name": "No Email"}, None)


def test_row_to_payload_bad_email():
    with pytest.raises(L.ValidationError):
        L.row_to_payload({"name": "X", "email": "broken"}, None)


def test_row_to_payload_invalid_status():
    with pytest.raises(L.ValidationError):
        L.row_to_payload({"name": "X", "email": "x@y.co", "status": "wat"}, None)


def test_row_to_payload_defaults_status_new():
    p = L.row_to_payload({"name": "X", "email": "x@y.co"}, None)
    assert p["status"] == "new"


# ---- dedupe + build -------------------------------------------------------
def test_dedupe_payloads_last_wins():
    payloads = [
        {"email": "a@x.com", "name": "A", "status": "new"},
        {"email": "A@X.com", "name": "A2", "status": "contacted"},
        {"email": "b@x.com", "name": "B"},
    ]
    out, dup = L.dedupe_payloads(payloads)
    assert dup == 1
    by_email = {p["email"]: p for p in out}
    assert len(out) == 2
    assert by_email["a@x.com"]["name"] == "A2"
    assert by_email["a@x.com"]["status"] == "contacted"


def test_build_payloads_counts():
    records = [
        {"name": "Good", "email": "good@x.co"},
        {"name": "", "email": ""},                 # blank -> skipped
        {"name": "BadEmail", "email": "nope"},      # invalid
        {"name": "Dup", "email": "good@x.co"},      # dup
    ]
    payloads, res = L.build_payloads(records, default_owner=None)
    assert len(payloads) == 1
    assert res.skipped_blank == 1
    assert res.invalid == 1
    assert res.duplicates_merged == 1
    assert not res.ok  # invalid present


# ---- transport / retry ----------------------------------------------------
class FakeTransport:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __call__(self, url, headers, body, timeout):
        self.calls.append((url, headers, body))
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item  # (status, text, headers)


def _payload():
    return {"name": "T", "email": "t@x.co", "status": "new"}


def test_upsert_success_first_try():
    t = FakeTransport([(200, "[]", {})])
    ok, detail = L.upsert_contact(_payload(), base_url="https://h", service_key="k",
                                  transport=t, sleep=lambda s: None)
    assert ok and detail == "ok"
    assert len(t.calls) == 1
    url, headers, body = t.calls[0]
    assert url.endswith("/rest/v1/rpc/upsert_pilot_contact")
    assert body == {"p": _payload()}
    assert headers["apikey"] == "k"


def test_upsert_retries_then_succeeds():
    t = FakeTransport([(500, "err", {}), (503, "err", {}), (201, "[]", {})])
    ok, _ = L.upsert_contact(_payload(), base_url="https://h", service_key="k",
                             transport=t, sleep=lambda s: None)
    assert ok
    assert len(t.calls) == 3


def test_upsert_no_retry_on_4xx():
    t = FakeTransport([(400, "bad request", {})])
    ok, detail = L.upsert_contact(_payload(), base_url="https://h", service_key="k",
                                  transport=t, sleep=lambda s: None)
    assert not ok
    assert "HTTP 400" in detail
    assert len(t.calls) == 1  # fail fast


def test_upsert_exhausts_retries():
    t = FakeTransport([(500, "e", {})] * 10)
    ok, detail = L.upsert_contact(_payload(), base_url="https://h", service_key="k",
                                  transport=t, max_retries=3, sleep=lambda s: None)
    assert not ok
    assert len(t.calls) == 4  # initial + 3 retries


def test_upsert_network_error_then_success():
    t = FakeTransport([ConnectionError("boom"), (200, "[]", {})])
    ok, _ = L.upsert_contact(_payload(), base_url="https://h", service_key="k",
                             transport=t, sleep=lambda s: None)
    assert ok
    assert len(t.calls) == 2


def test_upsert_respects_retry_after():
    slept = []
    t = FakeTransport([(429, "slow down", {"Retry-After": "2"}), (200, "[]", {})])
    ok, _ = L.upsert_contact(_payload(), base_url="https://h", service_key="k",
                             transport=t, sleep=lambda s: slept.append(s))
    assert ok
    assert slept and slept[0] == 2.0


# ---- file reading + dry-run end-to-end ------------------------------------
def test_read_csv_and_dry_run(tmp_path):
    csv_path = tmp_path / "contacts.csv"
    csv_path.write_text(
        "Name,Email,Persona,Channel,Warmth (1-5),Status\n"
        "Jordan Lee,jordan@acme.com,agency_founder,both,5,new\n"
        "Sam Patel,sam@beta.io,sdr_leader,linkedin,4,contacted\n"
        ",,,,,\n",  # blank padding row
        encoding="utf-8",
    )
    records = L.read_rows(csv_path)
    assert len(records) == 3
    res = L.run(str(csv_path), sheet=None, dry_run=True, default_owner="ara",
                base_url=None, service_key=None)
    assert res.skipped_blank == 1
    assert res.invalid == 0
    assert res.ok


def test_run_dry_run_does_not_need_credentials(tmp_path):
    csv_path = tmp_path / "c.csv"
    csv_path.write_text("Name,Email\nA,a@b.co\n", encoding="utf-8")
    res = L.run(str(csv_path), sheet=None, dry_run=True, default_owner=None,
                base_url=None, service_key=None)
    assert res.ok
