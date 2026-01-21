import { Submission } from "../models/submission.js";
import { AssignedTest } from "../models/assignedTest.js";
import { Question } from "../models/questions.js";

export async function submitAnswer(req, res) {
    const { assignedTestId, questionId } = req.params;
    const { answer } = req.body;

    if (!assignedTestId || !questionId || answer === undefined) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    const assignedTest = await AssignedTest.findOne({ assignedId: assignedTestId });
    if (!assignedTest) {
        return res.status(404).json({ error: "Assigned test not found" });
    }

    const candidateId = req.user?._id?.toString();
    if (candidateId && assignedTest.candidateId.toString() !== candidateId) {
        return res.status(403).json({ error: "Cannot submit answer for another candidate's test" });
    }

    if (assignedTest.status !== "in_progress") {
        return res
            .status(400)
            .json({ error: "Cannot submit answer for a test that is not in progress" });
    }

    // Auto-grade multiple choice questions
    const question = await Question.findById(questionId);
    if (!question) {
        return res.status(404).json({ error: "Question not found" });
    }

    let isCorrect = false;
    let score = 0;
    let evaluated = false;

    if (question.testType === "multiple_choice") {
        const numericAnswer = typeof answer === "number" ? answer : Number(answer);
        isCorrect = Number.isFinite(numericAnswer) && numericAnswer === question.correctOption;
        score = isCorrect ? (question.marks || 1) : 0;
        evaluated = true;
    }

    const submission = await Submission.create({
        assignedTestId: assignedTest._id,
        questionId,
        answer: String(answer),
        isCorrect,
        score,
        evaluated,
    });

    return res.status(201).json(submission);
}
