import mongoose from "mongoose";
import { AssignedTest } from "../models/assignedTest.js";

export async function assignedTestToCandidate(req, res) {
    const { candidateId, interviewTemplate, status, startTime, endTime, expireAt } = req.body;
    if(!candidateId || !interviewTemplate || !expireAt|| !Date.parse(expireAt)|| (startTime && isNaN(Date.parse(startTime))) || (endTime && isNaN(Date.parse(endTime)))) {
        return res.status(400).json({ error: "Invalid input data" });
    }
    const newAssignedTest = await AssignedTest.create({
        assignedId: new mongoose.Types.ObjectId().toString(),
        candidateId,
        interviewTemplate,
        status: status || "pending",
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        expiresAt: new Date(expireAt)
    });
    res.status(201).json(newAssignedTest);
}

export async function getAssignedTestsForCandidate(req, res) {
    const candidateId = req.user?._id;
    if(!candidateId) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    const assignedTests = await AssignedTest.find({ candidateId }).populate('interviewTemplate').sort({ createdAt: -1 });
    res.json(assignedTests);
}