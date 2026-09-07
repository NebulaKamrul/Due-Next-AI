import { Assignment } from "@workspace/api-client-react";

const STORAGE_KEY = "duenext_results";

export const ASSIGNMENT_TYPES = [
  { value: "assignment", label: "Assignment" },
  { value: "quiz", label: "Quiz" },
  { value: "test", label: "Test" },
  { value: "exam", label: "Exam" },
  { value: "midterm", label: "Midterm" },
  { value: "final", label: "Final" },
  { value: "practical", label: "Practical" },
  { value: "class-activity", label: "Class Activity" },
  { value: "other", label: "Other" },
] as const;

export type AssignmentType = typeof ASSIGNMENT_TYPES[number]["value"];

export interface EditableAssignment extends Assignment {
  dueTime?: string | null;
  activityTime?: string | null;
  type?: AssignmentType;
}

export interface StoredResults {
  assignments: EditableAssignment[];
  courseName: string | null;
}

export function saveResults(data: StoredResults) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function loadResults(): StoredResults | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredResults;
  } catch {
    return null;
  }
}

export function clearResults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
