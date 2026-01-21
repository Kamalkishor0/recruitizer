import { AssignedTest } from "../models/assignedTest.js";

export async function startTest(req, res) {
    const { assignedTestId, candidateId } = req.params;

    if (!assignedTestId) {
        return res.status(400).json({ error: "assignedTestId is required" });
    }

    const assignedTest = await AssignedTest.findOne({ assignedId: assignedTestId }).populate({
        path: "interviewTemplate",
        populate: { path: "questions" },
    });

    if (!assignedTest) {
        return res.status(404).json({ error: "Assigned test not found" });
    }

    if (candidateId && assignedTest.candidateId.toString() !== candidateId) {
        return res.status(403).json({ error: "Candidate not authorized for this test" });
    }

    if (assignedTest.status === "in_progress") {
        return res.status(400).json({ error: "Test already started" });
    }

    if (assignedTest.status === "completed" || assignedTest.status === "passed" || assignedTest.status === "failed") {
        return res.status(400).json({ error: "Test already completed" });
    }

    const now = new Date();
    if (assignedTest.expiresAt && now > assignedTest.expiresAt) {
        return res.status(400).json({ error: "Test assignment has expired" });
    }

    assignedTest.status = "in_progress";
    assignedTest.startTime = now;
    await assignedTest.save();

    await assignedTest.populate({
        path: "interviewTemplate",
        populate: { path: "questions" },
    });

    return res.status(200).json({
        message: "Test started",
        assignedTest: {
            candidateId: assignedTest.candidateId,
            assignedId: assignedTest.assignedId,
            status: assignedTest.status,
            startTime: assignedTest.startTime,
            endTime: assignedTest.endTime,
            expiresAt: assignedTest.expiresAt,
            interviewTemplate: assignedTest.interviewTemplate,
        },
    });
}