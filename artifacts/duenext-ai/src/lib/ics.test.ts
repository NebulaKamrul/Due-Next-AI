import { describe, it, expect } from "vitest";
import { generateICS } from "./ics";
import type { EditableAssignment } from "./store";

function assignment(overrides: Partial<EditableAssignment> = {}): EditableAssignment {
  return {
    name: "Assignment 1",
    dueDate: "2026-09-10",
    weight: null,
    description: null,
    ...overrides,
  };
}

describe("generateICS", () => {
  it("wraps events in a VCALENDAR block", () => {
    const ics = generateICS([assignment()]);
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.trim().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("skips assignments without a due date", () => {
    const ics = generateICS([assignment({ dueDate: "" })]);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("prefixes the summary with the course name when provided", () => {
    const ics = generateICS([assignment({ name: "Essay" })], "ENGL 101");
    expect(ics).toContain("SUMMARY:ENGL 101: Essay");
  });

  it("produces an all-day event when no time is given", () => {
    const ics = generateICS([assignment({ dueDate: "2026-09-10" })]);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260910");
    expect(ics).toContain("DTEND;VALUE=DATE:20260911");
  });

  it("produces a timed event with a 60-minute duration when dueTime is given", () => {
    const ics = generateICS([assignment({ dueDate: "2026-09-10", dueTime: "14:30" })]);
    expect(ics).toContain("DTSTART:20260910T143000");
    expect(ics).toContain("DTEND:20260910T153000");
  });

  it("rolls the end time over to the next hour correctly near midnight", () => {
    const ics = generateICS([assignment({ dueDate: "2026-09-10", dueTime: "23:45" })]);
    expect(ics).toContain("DTSTART:20260910T234500");
    expect(ics).toContain("DTEND:20260910T004500");
  });

  it("escapes commas, semicolons, and newlines in text fields", () => {
    const ics = generateICS([assignment({ name: "Part A; Part B, extra", description: "Line 1\nLine 2" })]);
    expect(ics).toContain("SUMMARY:Part A\\; Part B\\, extra");
    expect(ics).toContain("Line 1\\nLine 2");
  });

  it("includes the weight in the description when present", () => {
    const ics = generateICS([assignment({ weight: "20%", description: "Bring calculator" })]);
    expect(ics).toContain("Weight: 20%");
    expect(ics).toContain("Bring calculator");
  });

  it("gives each event a unique UID", () => {
    const ics = generateICS([assignment({ name: "A" }), assignment({ name: "B", dueDate: "2026-09-11" })]);
    const uids = [...ics.matchAll(/UID:([^\n]+)/g)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(2);
  });
});
