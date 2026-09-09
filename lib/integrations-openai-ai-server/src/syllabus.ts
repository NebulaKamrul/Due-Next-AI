import pRetry, { AbortError } from "p-retry";
import { openai } from "./client";

export interface ExtractedAssignment {
  name: string;
  dueDate: string;
  weight?: string | null;
  description?: string | null;
  needsReview?: boolean;
  dateHint?: string | null;
}

export interface ExtractedSyllabus {
  assignments: ExtractedAssignment[];
  courseName: string | null;
}

export class SyllabusExtractionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "SyllabusExtractionError";
  }
}

const MAX_INPUT_CHARS = 12000;
const MODEL = "gemini-2.5-flash-lite";
const MAX_COMPLETION_TOKENS = 8192;
const MAX_RETRIES = 2;

function buildSystemPrompt(currentYear: number): string {
  return `You are an AI assistant that extracts assignment due dates from course syllabi.
Extract all assignments, exams, quizzes, projects, and other graded items with their due dates.

Return a JSON object with this exact structure:
{
  "courseName": "Course name if detectable, or null",
  "assignments": [
    {
      "name": "Assignment name",
      "dueDate": "YYYY-MM-DD format",
      "weight": "percentage or points if mentioned, or null",
      "description": "brief additional context if useful, or null",
      "needsReview": true or false,
      "dateHint": "the original ambiguous date text, or null"
    }
  ]
}

Rules:
- Include every graded item mentioned - quizzes, exams, homework, projects, papers, presentations, participation, all of it. Do not skip items just because the date is unclear.
- When a date is explicit and unambiguous (e.g. "October 20, 2026" or "10/20"), convert it to YYYY-MM-DD and set "needsReview": false.
- When a date is vague (e.g. "Week 5", "TBD", "mid-semester", a date range), make your best estimate using any other anchors in the text (term start date, other dated assignments, weekday patterns), still return a real YYYY-MM-DD date, but set "needsReview": true and put the original text verbatim in "dateHint" (e.g. "Week 5"). Never leave dueDate blank.
- Only omit an item entirely if there is truly no date information anywhere for it (not even a rough week or term reference) and no way to estimate one.
- Convert all dates to YYYY-MM-DD format, using 4-digit years.
- If a year is not specified, infer it from context (term dates, weekday/date pairs, other assignment years already present). If nothing anchors the year, assume the current academic year (${currentYear} or ${currentYear + 1} depending on whether the syllabus reads as a fall/winter/spring/summer term).
- The same assignment is often mentioned more than once (e.g. once in a grading table, again in a weekly schedule). List it only once, using the most specific date given.
- Normalize weight to a short string like "15%" or "20 pts" when mentioned; use null when no weight is given.
- Sort assignments chronologically by dueDate.
- Return valid JSON only, no markdown, no explanation, no trailing commas.`;
}

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

function isRetryableError(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  return status === undefined || status === 429 || status >= 500;
}

async function requestCompletion(systemPrompt: string, userPrompt: string) {
  try {
    return await pRetry(
      () =>
        openai.chat.completions.create({
          model: MODEL,
          max_completion_tokens: MAX_COMPLETION_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      {
        retries: MAX_RETRIES - 1,
        minTimeout: 500,
        maxTimeout: 2000,
        factor: 2,
        onFailedAttempt: ({ error }) => {
          if (!isRetryableError(error)) {
            throw new AbortError(error);
          }
        },
      },
    );
  } catch (err) {
    console.error("Gemini API error:", err);
    throw new SyllabusExtractionError("Failed to extract due dates. Please try again.", 502);
  }
}

function parseModelJson(rawContent: string): { courseName?: string | null; assignments?: unknown[] } {
  try {
    return JSON.parse(rawContent);
  } catch {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new SyllabusExtractionError("Could not parse AI response. Please try again.", 502);
    }
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new SyllabusExtractionError("Could not parse AI response. Please try again.", 502);
    }
  }
}

function isPlainAssignment(
  value: unknown,
): value is { name: string; dueDate: string; weight?: string | null; description?: string | null; needsReview?: unknown; dateHint?: unknown } {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return typeof a.name === "string" && a.name.trim().length > 0 && typeof a.dueDate === "string" && isValidISODate(a.dueDate);
}

export async function extractDueDatesFromText(rawText: string): Promise<ExtractedSyllabus> {
  const text = (rawText ?? "").trim();
  if (text.length < 10) {
    throw new SyllabusExtractionError("Syllabus text is too short. Please paste more content.", 400);
  }

  const currentYear = new Date().getFullYear();
  const truncated = text.length > MAX_INPUT_CHARS;
  const content = text.slice(0, MAX_INPUT_CHARS);

  const userPrompt = `Extract all due dates from this syllabus${
    truncated ? " (note: the text below was truncated to fit length limits - extract everything present, there may be more assignments not shown)" : ""
  }:\n\n${content}`;

  const completion = await requestCompletion(buildSystemPrompt(currentYear), userPrompt);
  const rawContent = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parseModelJson(rawContent);

  const seen = new Set<string>();
  const assignments: ExtractedAssignment[] = (parsed.assignments ?? [])
    .filter(isPlainAssignment)
    .map((a) => ({
      name: a.name.trim(),
      dueDate: a.dueDate,
      weight: a.weight ?? null,
      description: a.description ?? null,
      needsReview: a.needsReview === true,
      dateHint: typeof a.dateHint === "string" ? a.dateHint : null,
    }))
    .filter((a) => {
      const key = `${a.name.toLowerCase()}|${a.dueDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    assignments,
    courseName: typeof parsed.courseName === "string" ? parsed.courseName : null,
  };
}
