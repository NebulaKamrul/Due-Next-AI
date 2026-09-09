import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("./client", () => ({
  openai: { chat: { completions: { create: (...args: unknown[]) => createMock(...args) } } },
}));

const { extractDueDatesFromText, SyllabusExtractionError } = await import("./syllabus");

function completionWith(content: string) {
  return { choices: [{ message: { content } }] };
}

beforeEach(() => {
  createMock.mockReset();
});

describe("extractDueDatesFromText", () => {
  it("rejects text that is too short without calling the model", async () => {
    await expect(extractDueDatesFromText("hi")).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("parses a well-formed model response", async () => {
    createMock.mockResolvedValueOnce(
      completionWith(
        JSON.stringify({
          courseName: "CS 101",
          assignments: [
            { name: "Assignment 1", dueDate: "2026-09-10", weight: "10%", description: null },
            { name: "Midterm", dueDate: "2026-10-01", weight: null, description: "In class" },
          ],
        }),
      ),
    );

    const result = await extractDueDatesFromText("Course: CS 101\nAssignment 1 due Sept 10...");
    expect(result.courseName).toBe("CS 101");
    expect(result.assignments).toHaveLength(2);
    expect(result.assignments[0].name).toBe("Assignment 1");
  });

  it("recovers JSON wrapped in markdown fences or stray prose", async () => {
    createMock.mockResolvedValueOnce(
      completionWith(
        "Here you go:\n```json\n" +
          JSON.stringify({ courseName: null, assignments: [{ name: "Quiz 1", dueDate: "2026-09-15" }] }) +
          "\n```",
      ),
    );

    const result = await extractDueDatesFromText("Quiz 1 is on September 15th, worth nothing else matters here");
    expect(result.assignments).toEqual([
      { name: "Quiz 1", dueDate: "2026-09-15", weight: null, description: null, needsReview: false, dateHint: null },
    ]);
  });

  it("drops assignments with missing names or malformed dates instead of throwing", async () => {
    createMock.mockResolvedValueOnce(
      completionWith(
        JSON.stringify({
          assignments: [
            { name: "Valid", dueDate: "2026-11-01" },
            { name: "", dueDate: "2026-11-02" },
            { name: "Bad date", dueDate: "next Tuesday" },
            { dueDate: "2026-11-03" },
          ],
        }),
      ),
    );

    const result = await extractDueDatesFromText("A syllabus with some malformed model output mixed in");
    expect(result.assignments).toEqual([
      { name: "Valid", dueDate: "2026-11-01", weight: null, description: null, needsReview: false, dateHint: null },
    ]);
  });

  it("carries through needsReview and dateHint for estimated dates", async () => {
    createMock.mockResolvedValueOnce(
      completionWith(
        JSON.stringify({
          assignments: [
            { name: "Reading Response", dueDate: "2026-10-15", needsReview: true, dateHint: "Week 5" },
            { name: "Quiz 1", dueDate: "2026-09-15", needsReview: false },
          ],
        }),
      ),
    );

    const result = await extractDueDatesFromText("Reading response due Week 5. Quiz 1 on September 15th.");
    expect(result.assignments[0]).toMatchObject({ name: "Quiz 1", needsReview: false, dateHint: null });
    expect(result.assignments[1]).toMatchObject({ name: "Reading Response", needsReview: true, dateHint: "Week 5" });
  });

  it("deduplicates the same assignment mentioned twice", async () => {
    createMock.mockResolvedValueOnce(
      completionWith(
        JSON.stringify({
          assignments: [
            { name: "Final Project", dueDate: "2026-12-05" },
            { name: "final project", dueDate: "2026-12-05" },
          ],
        }),
      ),
    );

    const result = await extractDueDatesFromText("Final project mentioned twice in the syllabus text here");
    expect(result.assignments).toHaveLength(1);
  });

  it("sorts assignments chronologically regardless of model order", async () => {
    createMock.mockResolvedValueOnce(
      completionWith(
        JSON.stringify({
          assignments: [
            { name: "Later", dueDate: "2026-12-01" },
            { name: "Earlier", dueDate: "2026-09-01" },
          ],
        }),
      ),
    );

    const result = await extractDueDatesFromText("Two assignments listed out of chronological order");
    expect(result.assignments.map((a) => a.name)).toEqual(["Earlier", "Later"]);
  });

  it("throws a SyllabusExtractionError when the model response has no JSON at all", async () => {
    createMock.mockResolvedValueOnce(completionWith("Sorry, I can't help with that."));

    await expect(extractDueDatesFromText("A syllabus that triggers a refusal-style response")).rejects.toBeInstanceOf(
      SyllabusExtractionError,
    );
  });
});
