import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import pRetry, { AbortError } from "p-retry";
import { getClientIp, isRateLimited } from "../_lib/rate-limit";

// This function is intentionally self-contained (only npm packages, no imports
// from other workspace packages). It's bundled in isolation by Vercel's
// serverless function builder, and importing another workspace package here
// means resolving through a pnpm symlink to that package's raw TypeScript
// source - a rough edge for serverless bundlers that isn't worth the risk for
// one function. The local Express dev server (artifacts/api-server) has the
// equivalent logic and is free to share code normally since it isn't bundled
// this way.

interface ExtractedAssignment {
  name: string;
  dueDate: string;
  weight?: string | null;
  description?: string | null;
}

const MAX_INPUT_CHARS = 12000;
const MODEL = "gemini-2.5-flash-lite";
const MAX_COMPLETION_TOKENS = 8192;

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
      "description": "brief additional context if useful, or null"
    }
  ]
}

Rules:
- Only include items with a clear, resolvable due date. If a date cannot be determined with reasonable confidence (e.g. only "Week 5" with no calendar reference anywhere in the text), omit that item rather than guessing.
- Convert all dates to YYYY-MM-DD format, using 4-digit years.
- If a year is not specified, infer it from context (term dates, weekday/date pairs, other assignment years already present). If nothing anchors the year, assume the current academic year (${currentYear} or ${currentYear + 1} depending on whether the syllabus reads as a fall/winter/spring/summer term).
- The same assignment is often mentioned more than once (e.g. once in a grading table, again in a weekly schedule). List it only once, using the most specific date given.
- Normalize weight to a short string like "15%" or "20 pts" when mentioned; use null when no weight is given.
- Sort assignments chronologically by dueDate.
- Be comprehensive - include all quizzes, exams, homework, projects, papers, presentations, participation deadlines, and other graded milestones.
- Return valid JSON only, no markdown, no explanation, no trailing commas.`;
}

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function isRetryableError(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  return status === undefined || status === 429 || status >= 500;
}

function isPlainAssignment(value: unknown): value is { name: string; dueDate: string; weight?: string | null; description?: string | null } {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return typeof a.name === "string" && a.name.trim().length > 0 && typeof a.dueDate === "string" && isValidISODate(a.dueDate);
}

function parseModelJson(rawContent: string): { courseName?: string | null; assignments?: unknown[] } {
  try {
    return JSON.parse(rawContent);
  } catch {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no-json");
    return JSON.parse(jsonMatch[0]);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  if (isRateLimited(getClientIp(req))) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }

  const { text } = req.body ?? {};

  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return res.status(400).json({ error: "Syllabus text is too short. Please paste more content." });
  }

  const currentYear = new Date().getFullYear();
  const trimmed = text.trim();
  const truncated = trimmed.length > MAX_INPUT_CHARS;
  const content = trimmed.slice(0, MAX_INPUT_CHARS);

  const openai = new OpenAI({ apiKey, baseURL });

  let completion;
  try {
    completion = await pRetry(
      () =>
        openai.chat.completions.create({
          model: MODEL,
          max_completion_tokens: MAX_COMPLETION_TOKENS,
          messages: [
            { role: "system", content: buildSystemPrompt(currentYear) },
            {
              role: "user",
              content: `Extract all due dates from this syllabus${
                truncated ? " (note: the text below was truncated to fit length limits - extract everything present, there may be more assignments not shown)" : ""
              }:\n\n${content}`,
            },
          ],
        }),
      {
        retries: 1,
        minTimeout: 500,
        maxTimeout: 2000,
        factor: 2,
        onFailedAttempt: ({ error }) => {
          if (!isRetryableError(error)) throw new AbortError(error);
        },
      },
    );
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(502).json({ error: "Failed to extract due dates. Please try again." });
  }

  const rawContent = completion.choices[0]?.message?.content ?? "{}";

  let parsed: { courseName?: string | null; assignments?: unknown[] };
  try {
    parsed = parseModelJson(rawContent);
  } catch {
    return res.status(502).json({ error: "Could not parse AI response. Please try again." });
  }

  const seen = new Set<string>();
  const assignments: ExtractedAssignment[] = (parsed.assignments ?? [])
    .filter(isPlainAssignment)
    .map((a) => ({
      name: a.name.trim(),
      dueDate: a.dueDate,
      weight: a.weight ?? null,
      description: a.description ?? null,
    }))
    .filter((a) => {
      const key = `${a.name.toLowerCase()}|${a.dueDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return res.json({
    assignments,
    courseName: typeof parsed.courseName === "string" ? parsed.courseName : null,
  });
}
