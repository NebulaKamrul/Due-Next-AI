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
  courseName?: string | null;
}

export interface StoredResults {
  assignments: EditableAssignment[];
}

/**
 * Merges newly extracted assignments into an existing list, so uploading a
 * second syllabus adds to your deadlines instead of wiping out the first
 * course. Dedupes on name + date + course, since re-uploading the same
 * syllabus (or a syllabus update) shouldn't create duplicates.
 */
export function mergeAssignments(existing: EditableAssignment[], incoming: EditableAssignment[]): EditableAssignment[] {
  const key = (a: EditableAssignment) => `${(a.courseName ?? "").toLowerCase()}|${a.name.trim().toLowerCase()}|${a.dueDate}`;
  const seen = new Set(existing.map(key));
  const merged = [...existing];
  for (const assignment of incoming) {
    const k = key(assignment);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(assignment);
  }
  return merged;
}

export function uniqueCourseNames(assignments: EditableAssignment[]): string[] {
  return [...new Set(assignments.map((a) => a.courseName).filter((c): c is string => !!c))];
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
