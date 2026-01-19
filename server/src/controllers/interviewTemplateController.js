import { InterviewTemplate } from "../models/interviewTemplate.js";
import { loadQuestionsForTestType, isSupportedTestType } from "./questions/index.js";

const clampLimit = (value, min = 1, max = 50) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(Math.max(Math.round(numeric), min), max);
};

export async function createInterviewTemplate(req, res) {
  const { title, description, testType, timeLimit, totalMarks, questionIds } = req.body ?? {};

  if (!req.user?._id) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!title || !testType || !timeLimit || !totalMarks) {
    return res.status(400).json({
      error: "title, testType, timeLimit, and totalMarks are required.",
    });
  }

  if (!isSupportedTestType(testType)) {
    return res.status(400).json({ error: `Unsupported test type: ${testType}` });
  }

  try {
    const recruiterId = req.user._id;

    let questions;
    if (Array.isArray(questionIds) && questionIds.length > 0) {
      // When explicit question IDs are provided, scope them to the recruiter for safety.
      questions = await InterviewTemplate.db.model("questions").find({
        _id: { $in: questionIds },
        createdBy: recruiterId,
      });

      if (!questions.length) {
        return res.status(400).json({ error: "No matching questions found for this recruiter." });
      }
    } else {
      questions = await loadQuestionsForTestType(testType, { recruiterId });
    }

    if (!questions.length) {
      return res
        .status(404)
        .json({ error: `No ${testType} questions found for the given recruiter.` });
    }

    const template = await InterviewTemplate.create({
      title,
      description,
      recruiterId: req.user._id,
      testType,
      questions: questions.map(question => question._id),
      timeLimit,
      totalMarks,
    });

    return res.status(201).json(template);
  } catch (error) {
    console.error("Failed to create interview template", error);
    return res.status(500).json({ error: "Failed to create interview template." });
  }
}

export async function listInterviewTemplates(req, res) {
  try {
    const templates = await InterviewTemplate.find()
      .populate("questions")
      .sort({ createdAt: -1 });

    return res.json(templates);
  } catch (error) {
    console.error("Failed to list interview templates", error);
    return res.status(500).json({ error: "Failed to load interview templates." });
  }
}

// Recruiter-scoped listing (lightweight) for dashboard/sidebar usage
export async function listRecruiterTemplates(req, res) {
  try {
    const recruiterId = req.user?._id;
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    // Default to a generous limit when none is provided so the dashboard can show all templates
    const limit = req.query.limit ? clampLimit(req.query.limit, 1, 100) : 100;

    const templates = await InterviewTemplate.find({ recruiterId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select({
        title: 1,
        description: 1,
        testType: 1,
        totalMarks: 1,
        timeLimit: 1,
        createdAt: 1,
        questions: 1,
      })
      .populate("questions", "prompt description marks difficulty testType options correctOption tags");

    return res.json(templates);
  } catch (error) {
    console.error("Failed to list recruiter templates", error);
    return res.status(500).json({ error: "Failed to load templates." });
  }
}

export async function getInterviewTemplateById(req, res) {
  const { id } = req.params;

  try {
    const template = await InterviewTemplate.findById(id).populate("questions");
    if (!template) {
      return res.status(404).json({ error: "Interview template not found." });
    }

    return res.json(template);
  } catch (error) {
    console.error("Failed to fetch interview template", error);
    return res.status(500).json({ error: "Failed to load interview template." });
  }
}

export async function deleteInterviewTemplate(req, res) {
  const { id } = req.params;

  if (!req.user?._id) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const deleted = await InterviewTemplate.findOneAndDelete({ _id: id, recruiterId: req.user._id });

    if (!deleted) {
      return res.status(404).json({ error: "Template not found or not owned by you." });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete interview template", error);
    return res.status(500).json({ error: "Failed to delete interview template." });
  }
}
