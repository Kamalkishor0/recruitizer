import mongoose from "mongoose";
import { AssignedTest } from "../models/assignedTest.js";
import { Submission } from "../models/submission.js";
import { InterviewTemplate } from "../models/interviewTemplate.js";

const clampLimit = (value, min = 1, max = 20) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(Math.max(Math.round(numeric), min), max);
};

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

// Detailed list of assigned tests for a recruiter (execution tracking)
export async function getRecruiterAssignedTests(req, res) {
    try {
        const recruiterId = req.user?._id;
        if (!recruiterId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const allowedStatuses = ["pending", "in_progress", "completed"];
        const requestedStatus = typeof req.query.status === "string" ? req.query.status.split(",") : [];
        const statuses = (requestedStatus.length ? requestedStatus : ["pending", "in_progress"]).map((value) => value.trim()).filter((value) => allowedStatuses.includes(value));

        if (statuses.length === 0) {
            return res.status(400).json({ error: "Invalid status filter" });
        }

        const recruiterObjectId = new mongoose.Types.ObjectId(recruiterId);

        const assignments = await AssignedTest.aggregate([
            {
                $lookup: {
                    from: "interviewtemplates",
                    localField: "interviewTemplate",
                    foreignField: "_id",
                    as: "template",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "candidateId",
                    foreignField: "_id",
                    as: "candidate",
                },
            },
            {
                $addFields: {
                    recruiterIdFilled: {
                        $ifNull: ["$recruiterId", { $arrayElemAt: ["$template.recruiterId", 0] }],
                    },
                    templateTitle: {
                        $ifNull: [{ $arrayElemAt: ["$template.title", 0] }, "Untitled template"],
                    },
                    candidateName: {
                        $ifNull: [{ $arrayElemAt: ["$candidate.fullName", 0] }, null],
                    },
                    candidateEmail: {
                        $ifNull: [{ $arrayElemAt: ["$candidate.email", 0] }, null],
                    },
                },
            },
            {
                $match: {
                    recruiterIdFilled: recruiterObjectId,
                    status: { $in: statuses },
                },
            },
            {
                $project: {
                    _id: 0,
                    assignedId: 1,
                    candidateId: 1,
                    candidateName: 1,
                    candidateEmail: 1,
                    interviewTemplate: 1,
                    templateTitle: 1,
                    status: 1,
                    startTime: 1,
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);

        return res.json(assignments);
    } catch (err) {
        console.error("Failed to load recruiter assigned tests", err);
        return res.status(500).json({ error: "Failed to load assigned tests" });
    }
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

// Top candidates for a completed interview template (leaderboard)
export async function getTopCandidatesForTemplate(req, res) {
    try {
        const recruiterId = req.user?._id;
        const { templateId, limit } = req.query;

        if (!recruiterId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
            return res.status(400).json({ error: "Valid templateId is required" });
        }

        const recruiterObjectId = new mongoose.Types.ObjectId(recruiterId);
        const templateObjectId = new mongoose.Types.ObjectId(templateId);
        const topLimit = clampLimit(limit, 1, 20);

        const matchingAssignments = await AssignedTest.aggregate([
            { $match: { interviewTemplate: templateObjectId, status: "completed" } },
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
                    templateTitle: {
                        $ifNull: [{ $arrayElemAt: ["$template.title", 0] }, "Untitled template"],
                    },
                },
            },
            {
                $match: {
                    recruiterIdFilled: recruiterObjectId,
                },
            },
            {
                $project: {
                    _id: 1,
                    candidateId: 1,
                    templateTitle: 1,
                },
            },
        ]);

        if (!matchingAssignments.length) {
            return res.json({ templateId, templateTitle: null, topCandidates: [], totalCandidates: 0 });
        }

        const assignedIds = matchingAssignments.map(row => row._id);
        const templateTitle = matchingAssignments[0].templateTitle;

        const scores = await Submission.aggregate([
            { $match: { assignedTestId: { $in: assignedIds } } },
            {
                $group: {
                    _id: "$assignedTestId",
                    totalScore: { $sum: { $ifNull: ["$score", 0] } },
                    latestSubmissionAt: { $max: "$updatedAt" },
                },
            },
            {
                $lookup: {
                    from: "assignedtests",
                    localField: "_id",
                    foreignField: "_id",
                    as: "assigned",
                },
            },
            { $unwind: "$assigned" },
            {
                $lookup: {
                    from: "users",
                    localField: "assigned.candidateId",
                    foreignField: "_id",
                    as: "candidate",
                },
            },
            { $unwind: "$candidate" },
            {
                $group: {
                    _id: "$assigned.candidateId",
                    candidateName: { $first: "$candidate.fullName" },
                    candidateEmail: { $first: "$candidate.email" },
                    score: { $sum: "$totalScore" },
                    submittedAt: { $max: "$latestSubmissionAt" },
                },
            },
            { $sort: { score: -1, submittedAt: -1 } },
            { $limit: topLimit },
            {
                $project: {
                    _id: 0,
                    candidateId: { $toString: "$_id" },
                    candidateName: 1,
                    candidateEmail: 1,
                    score: 1,
                    submittedAt: 1,
                },
            },
        ]);

        return res.json({
            templateId,
            templateTitle,
            totalCandidates: scores.length,
            topCandidates: scores,
        });
    } catch (err) {
        console.error("Failed to fetch top candidates", err);
        return res.status(500).json({ error: "Failed to fetch top candidates" });
    }
}