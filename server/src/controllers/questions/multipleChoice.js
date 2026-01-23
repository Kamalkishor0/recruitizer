import { Question } from "../../models/questions.js";
import { InterviewTemplate } from "../../models/interviewTemplate.js";

export async function findMultipleChoiceQuestions({ recruiterId } = {}) {
    const query = { testType: "multiple_choice" };
    if (recruiterId) {
        query.createdBy = recruiterId;
    }

    return Question.find(query).sort({ createdAt: -1 });
}

export async function getMultipleChoiceQuestions(req, res) {
    try {
        const requestedRecruiterId = req.query?.recruiterId;
        const recruiterId = requestedRecruiterId || (req.user?.role === "admin" ? undefined : req.user?._id);
        const questions = await findMultipleChoiceQuestions({ recruiterId });

        return res.json(questions);
    } catch (error) {
        return res.status(500).json({ error: "Failed to load multiple choice questions." });
    }
}

export async function createMultipleChoiceQuestion(req, res) {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ error: "Authentication required." });
        }

        const { prompt, description, options, correctOption, difficulty, tags, marks } = req.body;

        const newQuestion = await Question.create({
            testType: "multiple_choice",
            prompt,
            description,
            options,
            correctOption,
            difficulty,
            tags,
            marks: typeof marks === "number" && marks > 0 ? marks : 1,
            createdBy: req.user._id,
        });

        return res.status(201).json(newQuestion);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export async function deleteMultipleChoiceQuestion(req, res) {
    const { id } = req.params;

    if (!req.user?._id) {
        return res.status(401).json({ error: "Authentication required." });
    }

    try {
        const deleted = await Question.findOneAndDelete({
            _id: id,
            createdBy: req.user._id,
            testType: "multiple_choice",
        });

        if (!deleted) {
            return res.status(404).json({ error: "Question not found or not owned by you." });
        }

        // Clean up any templates that referenced this question for the same recruiter.
        await InterviewTemplate.updateMany(
            { recruiterId: req.user._id, questions: id },
            { $pull: { questions: id } },
        );

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete question." });
    }
}