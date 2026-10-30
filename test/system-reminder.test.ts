import { expect, test } from "bun:test"
import { systemReminder } from "../src/prompts"
import type { LoopSnapshot } from "../src/state"

function loop(overrides: Partial<LoopSnapshot> = {}) {
  return {
    id: "loop_abcde",
    sessionID: "ses_1",
    prompt: "say  tick",
    mode: "interval",
    intervalMs: 300_000,
    status: "active",
    runCount: 1,
    maxRuns: null,
    nextRunAt: 1_000,
    lastResult: null,
    stopReason: null,
    ...overrides,
  } as LoopSnapshot
}

test("system reminder stays byte-identical across runs so the prompt cache survives", () => {
  const before = systemReminder([loop()])
  const after = systemReminder([loop({ runCount: 2, nextRunAt: 2_000, lastResult: "success" as never })])
  expect(after).toBe(before)
})

test("system reminder identifies each open loop and skips closed ones", () => {
  const reminder = systemReminder([loop(), loop({ id: "loop_fghij", status: "paused", mode: "dynamic" })])
  expect(reminder).toContain("2 recurring loop(s)")
  expect(reminder).toContain("loop_abcde [active], every 5m - say tick")
  expect(reminder).toContain("loop_fghij [paused], dynamic pacing - say tick")
  expect(systemReminder([loop({ status: "stopped" as never })])).toBe("")
})
