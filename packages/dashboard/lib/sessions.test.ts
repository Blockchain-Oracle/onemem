import { describe, expect, it } from "vitest";
import { groupSessions } from "./sessions";
import type { SessionListItem } from "./trace";

const item = (sessionId: string, environment: string, startedAtMs: number): SessionListItem => ({
  sessionId,
  agentId: "agent",
  environment,
  namespaceId: "0xnamespace",
  sdkVersion: "0.1.0",
  capturedByAddress: "0xabc",
  startedAtMs,
  openedAtMs: startedAtMs,
});

describe("groupSessions", () => {
  it("groups recent sessions by local day and runtime", () => {
    const groups = groupSessions([
      item("0x1", "claude-code", Date.parse("2026-06-17T09:00:00Z")),
      item("0x2", "hermes", Date.parse("2026-06-17T10:00:00Z")),
      item("0x3", "claude-code", Date.parse("2026-06-16T11:00:00Z")),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.sessionCount).toBe(2);
    expect(groups[0]?.runtimeCount).toBe(2);
    expect(groups[0]?.lanes.map((lane) => lane.runtime).sort()).toEqual(["claude-code", "hermes"]);
    expect(groups[1]?.sessionCount).toBe(1);
  });

  it("keeps sub-session trace links canonical", () => {
    const [group] = groupSessions([
      item("0xabc123", "openclaw", Date.parse("2026-06-17T09:00:00Z")),
    ]);

    expect(group?.sessions[0]?.href).toBe("/trace/0xabc123");
    expect(group?.sessions[0]?.laneWidthPct).toBeGreaterThan(0);
  });
});
