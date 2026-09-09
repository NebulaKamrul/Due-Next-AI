import { describe, it, expect } from "vitest";
import { mergeAssignments, uniqueCourseNames } from "./store";
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

describe("mergeAssignments", () => {
  it("appends assignments from a second course to an existing list", () => {
    const existing = [assignment({ name: "Essay", courseName: "ENGL 101" })];
    const incoming = [assignment({ name: "Midterm", dueDate: "2026-10-01", courseName: "CS 101" })];
    const merged = mergeAssignments(existing, incoming);
    expect(merged).toHaveLength(2);
    expect(merged.map((a) => a.name)).toEqual(["Essay", "Midterm"]);
  });

  it("does not duplicate the same assignment re-extracted from the same course", () => {
    const existing = [assignment({ name: "Essay", dueDate: "2026-09-10", courseName: "ENGL 101" })];
    const incoming = [assignment({ name: "essay", dueDate: "2026-09-10", courseName: "ENGL 101" })];
    const merged = mergeAssignments(existing, incoming);
    expect(merged).toHaveLength(1);
  });

  it("treats the same assignment name/date as distinct when courses differ", () => {
    const existing = [assignment({ name: "Midterm", dueDate: "2026-10-01", courseName: "CS 101" })];
    const incoming = [assignment({ name: "Midterm", dueDate: "2026-10-01", courseName: "MATH 201" })];
    const merged = mergeAssignments(existing, incoming);
    expect(merged).toHaveLength(2);
  });
});

describe("uniqueCourseNames", () => {
  it("returns unique, non-null course names in first-seen order", () => {
    const assignments = [
      assignment({ courseName: "CS 101" }),
      assignment({ courseName: "MATH 201" }),
      assignment({ courseName: "CS 101" }),
      assignment({ courseName: null }),
    ];
    expect(uniqueCourseNames(assignments)).toEqual(["CS 101", "MATH 201"]);
  });
});
