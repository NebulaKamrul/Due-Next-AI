import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";

const STORAGE_KEY = "duenext_results";

export interface StoredResults {
  assignments: Assignment[];
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
