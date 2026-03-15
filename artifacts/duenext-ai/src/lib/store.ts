import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";

const STORAGE_KEY = "duenext_results";

export const CALENDAR_COLORS = [
  { name: "Tomato", hex: "#D50000" },
  { name: "Flamingo", hex: "#E67C73" },
  { name: "Tangerine", hex: "#F4511E" },
  { name: "Banana", hex: "#F6BF26" },
  { name: "Sage", hex: "#33B679" },
  { name: "Basil", hex: "#0B8043" },
  { name: "Peacock", hex: "#039BE5" },
  { name: "Blueberry", hex: "#3F51B5" },
  { name: "Lavender", hex: "#7986CB" },
  { name: "Grape", hex: "#8E24AA" },
  { name: "Graphite", hex: "#616161" },
] as const;

export type CalendarColor = typeof CALENDAR_COLORS[number];

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
  color?: string | null;
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
