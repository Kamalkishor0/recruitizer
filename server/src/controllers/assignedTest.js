import mongoose from "mongoose";
import { AssignedTest } from "../models/assignedTest.js";
import { Submission } from "../models/submission.js";
import { InterviewTemplate } from "../models/interviewTemplate.js";
import { User } from "../models/user.js";

const clampLimit = (value, min = 1, max = 20) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(Math.max(Math.round(numeric), min), max);
};

export async function assignedTestToCandidate(req, res) {
    const { candidateId, candidateEmail, interviewTemplate, status, startTime, endTime, expireAt } = req.body;

    const normalizedEmail = typeof candidateEmail === "string" ? candidateEmail.trim().toLowerCase() : null;

    if ((!candidateId && !normalizedEmail) || !interviewTemplate || !expireAt || !Date.parse(expireAt) || (startTime && isNaN(Date.parse(startTime))) || (endTime && isNaN(Date.parse(endTime)))) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    const candidate = candidateId
        ? await User.findById(candidateId)
        : normalizedEmail
            ? await User.findOne({ email: normalizedEmail })
            : null;

    if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
    }

    // Load template to capture recruiter ownership and validate access.
    const template = await InterviewTemplate.findById(interviewTemplate);
    if (!template) {
        return res.status(404).json({ error: "Interview template not found" });
    }

    if (req.user?.role === "recruiter" && template.recruiterId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "You cannot assign a template you don't own" });
    }

    const existing = await AssignedTest.findOne({
        candidateId: candidate._id,
        interviewTemplate,
    });

    if (existing) {
        return res.status(409).json({ error: "Candidate already has this interview assigned", assignedId: existing.assignedId || existing._id });
    }

    const newAssignedTest = await AssignedTest.create({
        assignedId: new mongoose.Types.ObjectId().toString(),
        candidateId: candidate._id,
        interviewTemplate,
        recruiterId: template.recruiterId,
        status: status || "pending",
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        expiresAt: new Date(expireAt),
    });

    res.status(201).json({
        assignedId: newAssignedTest.assignedId,
        candidateId: newAssignedTest.candidateId,
        interviewTemplate: newAssignedTest.interviewTemplate,
        status: newAssignedTest.status,
        startTime: newAssignedTest.startTime,
        endTime: newAssignedTest.endTime,
        expiresAt: newAssignedTest.expiresAt,
        createdAt: newAssignedTest.createdAt,
    });
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

        const allowedStatuses = ["pending", "in_progress", "completed", "passed", "failed"];
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
                $lookup: {
                    from: "submissions",
                    localField: "_id",
                    foreignField: "assignedTestId",
                    as: "submissions",
                },
            },
            {
                $addFields: {
                    score: {
                        $cond: [
                            { $gt: [{ $size: "$submissions" }, 0] },
                            { $sum: "$submissions.score" },
                            null,
                        ],
                    },
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
                    score: 1,
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
        const completedAssignments = recruiterAssignments.filter((row) => row.status === "completed" || row.status === "passed" || row.status === "failed");
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

const TOP_ASSIGNMENT_STATUSES = ["completed", "passed"];

async function computeTopCandidates(recruiterObjectId, templateObjectId, topLimit) {
    const matchingAssignments = await AssignedTest.aggregate([
        { $match: { interviewTemplate: templateObjectId, status: { $in: TOP_ASSIGNMENT_STATUSES } } },
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
        return { templateTitle: null, topCandidates: [], totalCandidates: 0 };
    }

    const assignedIds = matchingAssignments.map((row) => row._id);
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

    return { templateTitle, topCandidates: scores, totalCandidates: scores.length };
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

        const { templateTitle, topCandidates, totalCandidates } = await computeTopCandidates(recruiterObjectId, templateObjectId, topLimit);

        return res.json({ templateId, templateTitle, totalCandidates, topCandidates });
    } catch (err) {
        console.error("Failed to fetch top candidates", err);
        return res.status(500).json({ error: "Failed to fetch top candidates" });
    }
}

// Promote top K candidates for a template to passed and return their contact list
export async function markTopCandidatesAsPassed(req, res) {
    try {
        const recruiterId = req.user?._id;
        const { templateId, limit } = req.body;

        if (!recruiterId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
            return res.status(400).json({ error: "Valid templateId is required" });
        }

        const recruiterObjectId = new mongoose.Types.ObjectId(recruiterId);
        const templateObjectId = new mongoose.Types.ObjectId(templateId);
        const topLimit = clampLimit(limit, 1, 20);

        const { templateTitle, topCandidates } = await computeTopCandidates(recruiterObjectId, templateObjectId, topLimit);

        if (!topCandidates.length) {
            return res.json({ templateId, templateTitle, updatedCount: 0, topCandidates: [], emails: [] });
        }

        const candidateObjectIds = topCandidates
            .map((candidate) => {
                try {
                    return new mongoose.Types.ObjectId(candidate.candidateId);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        const updateResult = await AssignedTest.updateMany(
            {
                interviewTemplate: templateObjectId,
                candidateId: { $in: candidateObjectIds },
                status: { $ne: "passed" },
            },
            { $set: { status: "passed" } },
        );

        // Mark the remaining completed assignments for this template as failed (excluding those just passed)
        const failResult = await AssignedTest.updateMany(
            {
                interviewTemplate: templateObjectId,
                candidateId: { $nin: candidateObjectIds },
                status: { $in: ["completed", "passed"] },
            },
            { $set: { status: "failed" } },
        );

        const emails = topCandidates.map((candidate) => candidate.candidateEmail).filter(Boolean);

        return res.json({
            templateId,
            templateTitle,
            updatedCount: updateResult?.modifiedCount ?? 0,
            failedCount: failResult?.modifiedCount ?? 0,
            topCandidates,
            emails,
        });
    } catch (err) {
        console.error("Failed to promote top candidates", err);
        return res.status(500).json({ error: "Failed to promote top candidates" });
    }
}