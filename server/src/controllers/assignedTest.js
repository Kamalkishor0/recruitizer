import mongoose from "mongoose";
import { AssignedTest } from "../models/assignedTest.js";
import { Submission } from "../models/submission.js";
import { InterviewTemplate } from "../models/interviewTemplate.js";

export async function assignedTestToCandidate(req, res) {
    const { candidateId, interviewTemplate, status, startTime, endTime, expireAt } = req.body;
    if(!candidateId || !interviewTemplate || !expireAt|| !Date.parse(expireAt)|| (startTime && isNaN(Date.parse(startTime))) || (endTime && isNaN(Date.parse(endTime)))) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    // Load template to capture recruiter ownership and validate access.
    const template = await InterviewTemplate.findById(interviewTemplate);
    if (!template) {
        return res.status(404).json({ error: "Interview template not found" });
    }

    if (req.user?.role === "recruiter" && template.recruiterId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "You cannot assign a template you don't own" });
    }

    const newAssignedTest = await AssignedTest.create({
        assignedId: new mongoose.Types.ObjectId().toString(),
        candidateId,
        interviewTemplate,
        recruiterId: template.recruiterId,
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

// Overview metrics for recruiter dashboard
export async function getRecruiterOverview(req, res) {
    try {
        const recruiterId = req.user?._id;
        if (!recruiterId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Scope metrics to this recruiter. If recruiterId is stored on the assignment, use it; otherwise fall back to template.recruiterId (for older records).
        const recruiterObjectId = new mongoose.Types.ObjectId(recruiterId);
        const recruiterAssignments = await AssignedTest.aggregate([
            {
                $lookup: {
                    from: "interviewtemplates",
                    localField: "interviewTemplate",
                    foreignField: "_id",
                    as: "template",
                },
            },
            {
                $addFields: {
                    recruiterIdFilled: {
                        $ifNull: ["$recruiterId", { $arrayElemAt: ["$template.recruiterId", 0] }],
                    },
                },
            },
            { $match: { recruiterIdFilled: recruiterObjectId } },
            { $project: { status: 1, candidateId: 1, _id: 1 } },
        ]);

        const totalScheduled = recruiterAssignments.length;
        const pendingCount = recruiterAssignments.filter((row) => row.status === "pending").length;
        const completedAssignments = recruiterAssignments.filter((row) => row.status === "completed");
        const completedCount = completedAssignments.length;

        let evaluatedAgg = [];
        if (recruiterAssignments.length > 0) {
            const assignedIds = recruiterAssignments.map((row) => row._id);
            evaluatedAgg = await Submission.aggregate([
                { $match: { evaluated: true, assignedTestId: { $in: assignedIds } } },
                { $group: { _id: "$assignedTestId" } },
                {
                    $lookup: {
                        from: "assignedtests",
                        localField: "_id",
                        foreignField: "_id",
                        as: "assigned",
                    },
                },
                { $unwind: "$assigned" },
                { $group: { _id: "$assigned.candidateId" } },
            ]);
        }

        const candidateSet = new Set(completedAssignments.map((row) => String(row.candidateId)));
        evaluatedAgg.forEach((row) => {
            if (row?._id) {
                candidateSet.add(String(row._id));
            }
        });

        return res.json({
            totalScheduled,
            pendingCount,
            completedCount,
            candidatesEvaluated: candidateSet.size,
        });
    } catch (err) {
        console.error("Failed to load recruiter overview", err);
        return res.status(500).json({ error: "Failed to load overview" });
    }
}