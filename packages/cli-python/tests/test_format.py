"""Unit tests for the Python CLI formatting helpers (pure; no network)."""

from __future__ import annotations

from onemem_cli._format import print_table, short_hex, short_id, status_label


def test_status_label_known() -> None:
    assert status_label(0) == "Active"
    assert status_label(1) == "Completed"
    assert status_label(2) == "Failed"
    assert status_label(3) == "Aborted"


def test_status_label_unknown_never_prints_undefined() -> None:
    assert status_label(7) == "Unknown(7)"


def test_short_hex_from_bytes_and_list() -> None:
    assert short_hex([0x2E, 0xC8, 0xC2, 0x2D], 8) == "0x2ec8c22d"
    assert short_hex(bytes([255, 0, 16]), 6) == "0xff0010"


def test_short_hex_empty() -> None:
    assert short_hex(None) == ""
    assert short_hex([]) == ""


def test_short_hex_default_length_and_full_merkle_root() -> None:
    assert short_hex(bytes(32)) == "0x00000000"  # default 8 hex chars
    root = bytes(range(32))
    assert short_hex(root, 64) == "0x" + root.hex()  # 64 → full 32-byte root, no truncation


def test_short_hex_accepts_hex_string() -> None:
    assert short_hex("0xdeadbeef", 8) == "0xdeadbeef"
    assert short_hex("deadbeef", 4) == "0xdead"


def test_short_id_boundary() -> None:
    assert short_id("a" * 12, 10) == "a" * 12  # exactly head+2 → kept whole
    assert short_id("a" * 13, 10) == "a" * 10 + "…"  # head+3 → truncated


def test_print_table_empty(capsys) -> None:
    print_table([], ["a", "b"])
    assert capsys.readouterr().out == "(none)\n"


def test_print_table_aligns_and_strips(capsys) -> None:
    print_table([{"tool": "search", "n": "1"}, {"tool": "x", "n": "22"}], ["tool", "n"])
    lines = capsys.readouterr().out.rstrip().split("\n")
    assert lines[0] == "tool    n"
    assert lines[1] == "------  --"
    assert lines[2] == "search  1"
    assert lines[3] == "x       22"


def test_print_table_missing_key_is_blank(capsys) -> None:
    print_table([{"a": "hi"}], ["a", "b"])
    lines = capsys.readouterr().out.rstrip().split("\n")
    assert lines[2] == "hi"  # trailing empty 'b' cell stripped


def test_short_id() -> None:
    assert short_id("0x0123456789abcdef", 10) == "0x01234567…"
    assert short_id("0xabc", 10) == "0xabc"
