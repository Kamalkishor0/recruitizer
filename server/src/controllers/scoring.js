import { Submission } from "../models/submission.js";
import { AssignedTest } from "../models/assignedTest.js";

export async function scoringHandlerMCQ(req, res) {
    try {
        const { assignedTestId } = req.params;
        if (!assignedTestId) {
            return res.status(400).json({ error: "assignedTestId is required" });
        }

        const assignedTest = await AssignedTest.findOne({ assignedId: assignedTestId });
        if (!assignedTest) {
            return res.status(404).json({ error: "Assigned test not found" });
        }

        const submissions = await Submission.find({ assignedTestId: assignedTest._id }).populate(
            "questionId",
        );

        if (!submissions.length) {
            return res.status(404).json({ error: "No submissions found for this assigned test" });
        }

        let totalScore = 0;
        let maxScore = 0;
        let correctCount = 0;
        let incorrectCount = 0;

        const results = await Promise.all(
            submissions.map(async submission => {
                const question = submission.questionId;

                if (!question || question.testType !== "multiple_choice") {
                    submission.evaluated = true;
                    submission.isCorrect = false;
                    submission.score = 0;
                    await submission.save();
                    return {
                        submissionId: submission._id,
                        questionId: question?._id ?? null,
                        prompt: question?.prompt ?? null,
                        answer: submission.answer,
                        correctOption: question?.correctOption ?? null,
                        isCorrect: false,
                        score: 0,
                        note: "Question missing or not multiple choice",
                    };
                }

                const correctOption = question.correctOption;
                const answerIndex = Number(submission.answer);
                const isCorrect = Number.isFinite(answerIndex) && correctOption === answerIndex;
                const questionMarks = question.marks ?? 0;
                const score = isCorrect ? questionMarks : 0;

                submission.score = score;
                submission.isCorrect = isCorrect;
                submission.evaluated = true;
                await submission.save();

                if (isCorrect) {
                    totalScore += score;
                    correctCount += 1;
                } else {
                    incorrectCount += 1;
                }

                maxScore += questionMarks;

                return {
                    submissionId: submission._id,
                    questionId: question._id,
                    prompt: question.prompt,
                    answer: submission.answer,
                    correctOption,
                    isCorrect,
                    score,
                };
            }),
        );

        return res.status(200).json({
            message: "Scoring completed",
            summary: {
                totalQuestions: submissions.length,
                correct: correctCount,
                incorrect: incorrectCount,
                score: totalScore,
                maxScore,
            },
            results,
        });
    } catch (error) {
        console.error("Scoring failed", error);
        return res.status(500).json({ error: "Scoring failed" });
    }
}