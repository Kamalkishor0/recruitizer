import { InterviewTemplate } from "../models/interviewTemplate.js";
import { loadQuestionsForTestType, isSupportedTestType } from "./questions/index.js";

export async function createInterviewTemplate(req, res) {
  const { title, description, testType, timeLimit, totalMarks } = req.body ?? {};

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
    const questions = await loadQuestionsForTestType(testType, { recruiterId });

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
