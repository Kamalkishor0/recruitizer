import crypto from "crypto";
import fetch from "node-fetch";
import { InterviewTemplate } from "../../models/interviewTemplate.js";
import { Question } from "../../models/questions.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
const httpFetch = (...args) => (typeof globalThis.fetch === "function" ? globalThis.fetch(...args) : fetch(...args));

const buildEndpoint = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const candidateModels = Array.from(
  new Set([
    GEMINI_MODEL,
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
  ]),
);

const clampNumber = (value, min, max) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(Math.max(Math.round(numeric), min), max);
};

const safeText = (value) => (typeof value === "string" ? value.trim() : "");

const parseJsonFromText = (text) => {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  try {
    return JSON.parse(raw);
  } catch (err) {
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        return null;
      }
    }
    return null;
  }
};

const normalizeDifficulty = (value, fallback) => {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  return fallback;
};

const normalizeQuestion = (question, fallbackDifficulty, testType) => {
  const prompt = safeText(question?.prompt);
  const description = safeText(question?.description);
  const difficulty = normalizeDifficulty(question?.difficulty, fallbackDifficulty);
  const marks = Number.isFinite(question?.marks) && question.marks > 0 ? Math.round(question.marks) : 1;
  const tags = Array.isArray(question?.tags) ? question.tags.filter((tag) => typeof tag === "string" && tag.trim()).map((tag) => tag.trim()) : [];

  if (testType === "multiple_choice") {
    const options = Array.isArray(question?.options) ? question.options.map((opt) => safeText(opt)).filter(Boolean) : [];
    const correctOption = Number.isInteger(question?.correctOption) ? question.correctOption : 0;
    if (!prompt || options.length < 2) return null;
    const boundedCorrect = correctOption >= 0 && correctOption < options.length ? correctOption : 0;
    return { prompt, description, options, correctOption: boundedCorrect, difficulty, tags, marks, testType };
  }

  if (!prompt) return null;
  return { prompt, description, difficulty, tags, marks, testType };
};

const collectContentText = (candidate) => {
  if (!candidate) return "";
  if (candidate.content?.parts?.length) {
    return candidate.content.parts.map((part) => part?.text || "").join("\n");
  }
  if (candidate.output_text) return candidate.output_text;
  return "";
};

export async function generateGeminiTemplatePreview(req, res) {
  const { apiKey, role, questionCount = 5, difficulty = "medium", additionalDetails = "", testType = "multiple_choice" } = req.body ?? {};

  if (!req.user?._id) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!apiKey || !safeText(apiKey)) {
    return res.status(400).json({ error: "Gemini API key is required." });
  }

  if (!safeText(role)) {
    return res.status(400).json({ error: "Role or topic is required." });
  }

  const count = clampNumber(questionCount, 1, 20);
  const normalizedDifficulty = normalizeDifficulty(difficulty, "medium");
  const trimmedRole = safeText(role);

    const prompt = [
    `Generate ${count} ${normalizedDifficulty} ${testType === "multiple_choice" ? "multiple-choice" : ""} interview questions for a ${trimmedRole} role.`,
    "Return strict JSON only, no prose.",
    "JSON shape: {",
    "  \"title\": string,",
    "  \"description\": string,",
    "  \"timeLimit\": number (minutes),",
    "  \"totalMarks\": number,",
    "  \"questions\": [",
    "    {",
    "      \"prompt\": string,",
    "      \"description\": string,",
    "      \"difficulty\": \"easy|medium|hard\",",
    "      \"marks\": number,",
    "      \"tags\": [string],",
    testType === "multiple_choice"
      ? "      \"options\": [string, ...], \"correctOption\": number"
      : "      \"options\": [], \"correctOption\": 0",
    "    }",
    "  ]",
    "}",
    additionalDetails ? `Context: ${safeText(additionalDetails)}` : "",
    "Return JSON only. Do not include Markdown fences.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    let lastError = null;
    let payload = null;
    for (const model of candidateModels) {
      const response = await httpFetch(`${buildEndpoint(model)}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            topK: 40,
            topP: 0.95,
          },
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        lastError = { status: response.status, detail, model };
        // If model not found, try next candidate.
        if (response.status === 404) continue;
        return res.status(response.status || 502).json({ error: "Gemini generation failed.", detail, model });
      }

      payload = await response.json();
      lastError = null;
      break;
    }

    if (!payload) {
      const detail = lastError?.detail || "No response payload";
      return res.status(lastError?.status || 502).json({ error: "Gemini generation failed (model not available).", detail, triedModels: candidateModels });
    }
    const candidate = payload?.candidates?.[0];
    const text = collectContentText(candidate);
    const parsed = parseJsonFromText(text);

    if (!parsed?.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(502).json({ error: "Could not parse Gemini response." });
    }

    const normalizedQuestions = parsed.questions
      .map((q) => normalizeQuestion(q, normalizedDifficulty, testType))
      .filter(Boolean)
      .slice(0, count)
      .map((q, idx) => ({ ...q, id: crypto.randomUUID?.() || `gen-${Date.now()}-${idx}` }));

    // Introduce randomness: shuffle options for multiple-choice questions so
    // the correct answer isn't always the same option index (models often
    // bias to a fixed position). We use crypto.randomInt when available.
    if (testType === "multiple_choice") {
      const randInt = (max) => {
        if (typeof crypto.randomInt === "function") {
          try {
            return crypto.randomInt(0, max);
          } catch {
            return Math.floor(Math.random() * max);
          }
        }
        return Math.floor(Math.random() * max);
      };

      normalizedQuestions.forEach((q) => {
        if (!Array.isArray(q.options) || q.options.length <= 1) return;
        const origOptions = q.options.slice();
        const origCorrect = Number.isInteger(q.correctOption) ? q.correctOption : 0;

        // Fisher-Yates shuffle
        const shuffled = origOptions.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = randInt(i + 1);
          const tmp = shuffled[i];
          shuffled[i] = shuffled[j];
          shuffled[j] = tmp;
        }

        // Find new index of the originally-correct option
        const originalAnswer = origOptions[origCorrect];
        const newIndex = shuffled.findIndex((opt) => opt === originalAnswer);
        q.options = shuffled;
        q.correctOption = newIndex >= 0 ? newIndex : 0;
      });
    }

    if (!normalizedQuestions.length) {
      return res.status(502).json({ error: "Gemini did not return usable questions." });
    }

    const template = {
      title: safeText(parsed.title) || `${trimmedRole} interview (${normalizedDifficulty})`,
      description: safeText(parsed.description) || safeText(additionalDetails),
      testType,
      timeLimit: clampNumber(parsed.timeLimit, 5, 240) || count * 5,
      totalMarks: clampNumber(parsed.totalMarks, normalizedQuestions.length, normalizedQuestions.length * 10) || normalizedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
    };

    return res.json({ template, questions: normalizedQuestions });
  } catch (error) {
    console.error("Gemini generation error", error);
    return res.status(500).json({ error: "Failed to generate questions." });
  }
}

export async function saveGeneratedTemplate(req, res) {
  const { title, description = "", testType = "multiple_choice", timeLimit, totalMarks, questions } = req.body ?? {};

  if (!req.user?._id) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!safeText(title) || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "Title and at least one question are required." });
  }

  if (testType !== "multiple_choice" && testType !== "behavioral" && testType !== "coding") {
    return res.status(400).json({ error: "Unsupported test type." });
  }

  const normalizedQuestions = questions
    .map((q) => normalizeQuestion(q, "medium", testType))
    .filter(Boolean);

  if (!normalizedQuestions.length) {
    return res.status(400).json({ error: "No valid questions provided." });
  }

  try {
    const createdQuestions = await Question.insertMany(
      normalizedQuestions.map((q) => ({
        ...q,
        createdBy: req.user._id,
      })),
      { ordered: false },
    );

    const template = await InterviewTemplate.create({
      title: safeText(title),
      description: safeText(description),
      recruiterId: req.user._id,
      testType,
      questions: createdQuestions.map((q) => q._id),
      timeLimit: clampNumber(timeLimit, 5, 240) || normalizedQuestions.length * 5,
      totalMarks: clampNumber(totalMarks, normalizedQuestions.length, normalizedQuestions.length * 10) || normalizedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
    });

    return res.status(201).json({
      templateId: template._id,
      questionIds: createdQuestions.map((q) => q._id),
    });
  } catch (error) {
    console.error("Failed to save generated template", error);
    return res.status(500).json({ error: "Failed to save generated template." });
  }
}
