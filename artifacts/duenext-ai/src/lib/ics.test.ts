import { describe, it, expect } from "vitest";
import { generateICS, buildGoogleCalendarUrl } from "./ics";
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

  it("prefixes the summary with the assignment's course name when provided", () => {
    const ics = generateICS([assignment({ name: "Essay", courseName: "ENGL 101" })]);
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

  it("single-escapes the newline between the weight line and the description", () => {
    const ics = generateICS([assignment({ weight: "20%", description: "Bring calculator" })]);
    expect(ics).toContain("DESCRIPTION:Weight: 20%\\n\\nBring calculator");
    expect(ics).not.toContain("\\\\n");
  });

  it("gives each event a unique UID", () => {
    const ics = generateICS([assignment({ name: "A" }), assignment({ name: "B", dueDate: "2026-09-11" })]);
    const uids = [...ics.matchAll(/UID:([^\n]+)/g)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(2);
  });

  it("adds a 1-day-before reminder for all-day events", () => {
    const ics = generateICS([assignment({ dueDate: "2026-09-10" })]);
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("END:VALARM");
  });

  it("adds a 30-minute-before reminder for timed events", () => {
    const ics = generateICS([assignment({ dueDate: "2026-09-10", dueTime: "14:30" })]);
    expect(ics).toContain("TRIGGER:-PT30M");
  });
});

describe("buildGoogleCalendarUrl", () => {
  it("returns null when there is no due date", () => {
    expect(buildGoogleCalendarUrl(assignment({ dueDate: "" }))).toBeNull();
  });

  it("points at the Google Calendar render endpoint with a TEMPLATE action", () => {
    const url = buildGoogleCalendarUrl(assignment());
    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
  });

  it("encodes the course-prefixed title and the all-day date range", () => {
    const url = buildGoogleCalendarUrl(assignment({ name: "Essay", dueDate: "2026-09-10", courseName: "ENGL 101" }));
    const params = new URL(url!).searchParams;
    expect(params.get("text")).toBe("ENGL 101: Essay");
    expect(params.get("dates")).toBe("20260910/20260911");
  });

  it("encodes a timed date range when dueTime is set", () => {
    const url = buildGoogleCalendarUrl(assignment({ dueDate: "2026-09-10", dueTime: "14:30" }));
    const params = new URL(url!).searchParams;
    expect(params.get("dates")).toBe("20260910T143000/20260910T153000");
  });

  it("includes the weight in the details param", () => {
    const url = buildGoogleCalendarUrl(assignment({ weight: "20%" }));
    const params = new URL(url!).searchParams;
    expect(params.get("details")).toContain("Weight: 20%");
  });
});
