import fetch from "node-fetch";
import mongoose from "mongoose";
import Job from "../models/job.js";
import Resume from "../models/resume.js";
import OrigResume from "../models/origresume.js";
import JobsApplied from "../models/jobsApplied.js";
import { User } from "../models/user.js";

const mlServiceBase = process.env.ML_SERVICE_URL || "http://localhost:8001";

export async function createJob(req, res) {
  try {
    const recruiterId = req.user?._id;
    if (!recruiterId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

      const { title, description, requirements = "", skills = [], location = "", workType = "", seniority = "", expiryDate } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const expiresAt = expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(expiresAt.getTime())) {
      return res.status(400).json({ error: "Invalid expiry date" });
    }
    if (expiresAt <= new Date()) {
      return res.status(400).json({ error: "Expiry date must be in the future" });
    }

    const payload = {
      title,
      description,
      requirements,
      skills,
        workType,
      jobId: undefined,
    };

    const mlResponse = await fetch(`${mlServiceBase}/api/v1/job/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!mlResponse.ok) {
      const detail = await mlResponse.text();
      return res.status(502).json({ error: "Embedding service failed", detail });
    }

    const { embedding } = await mlResponse.json();
    if (!embedding || !Array.isArray(embedding)) {
      return res.status(502).json({ error: "Embedding not returned" });
    }

    const job = await Job.create({
      recruiterId,
      title,
      description,
      requirements,
      skills,
      location,
        workType,
      seniority,
      embedding,
      expiresAt,
    });

    return res.status(201).json({ job });
  } catch (err) {
    console.error("Failed to create job", err);
    return res.status(500).json({ error: "Failed to create job" });
  }
}

export async function listJobs(req, res) {
  try {
    const userId = req.user?._id;
    const now = new Date();
    const jobs = await Job.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    })
      .sort({ createdAt: -1 })
      .populate({ path: "recruiterId", select: "fullName" })
      .lean();

    const jobsWithRecruiter = jobs.map((job) => ({
      ...job,
      recruiterName: job.recruiterId?.fullName,
    }));

    let appliedIds = new Set();
    if (userId) {
      const apps = await JobsApplied.find({ userId }).select("jobId").lean();
      appliedIds = new Set(apps.map((app) => app.jobId.toString()));
    }

    const jobsWithApplied = jobsWithRecruiter.map((job) => ({
      ...job,
      applied: appliedIds.has(job._id.toString()),
    }));

    return res.json({ jobs: jobsWithApplied });
  } catch (err) {
    console.error("Failed to list jobs", err);
    return res.status(500).json({ error: "Failed to list jobs" });
  }
}

export async function getJobById(req, res) {
  try {
    const jobId = req.params?.jobId;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Invalid job id" });
    }

    const now = new Date();
    const job = await Job.findOne({
      _id: jobId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    })
      .populate({ path: "recruiterId", select: "fullName" })
      .lean();

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json({
      job: {
        ...job,
        recruiterName: job.recruiterId?.fullName,
      },
    });
  } catch (err) {
    console.error("Failed to fetch job", err);
    return res.status(500).json({ error: "Failed to fetch job" });
  }
}

export async function recommendJobsForCandidate(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const resume = await Resume.findOne({ userId }).lean();
    if (!resume?.embedding) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const now = new Date();
    const jobs = await Job.find(
      {
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: now } },
        ],
      },
      {
        title: 1,
        description: 1,
        requirements: 1,
        skills: 1,
        location: 1,
          workType: 1,
        seniority: 1,
        embedding: 1,
        expiresAt: 1,
        recruiterId: 1,
      },
    )
      .sort({ createdAt: -1 })
      .limit(300)
      .populate({ path: "recruiterId", select: "fullName" })
      .lean();

    if (!jobs.length) {
      return res.status(404).json({ error: "No active jobs available" });
    }

    const jobsWithRecruiter = jobs.map((job) => ({
      ...job,
      recruiterName: job.recruiterId?.fullName,
    }));

    const apps = await JobsApplied.find({ userId }).select("jobId").lean();
    const appliedIds = new Set(apps.map((app) => app.jobId.toString()));

    const topKParam = Number.parseInt(req.query?.topK, 10);
    const topK = Number.isFinite(topKParam) ? Math.min(Math.max(topKParam, 1), 200) : 20;

    const payload = {
      resumeEmbedding: resume.embedding,
      jobs: jobsWithRecruiter.map((job) => ({
        jobId: job._id.toString(),
        embedding: job.embedding,
        expiresAt: job.expiresAt,
      })),
      topK,
    };

    const mlResponse = await fetch(`${mlServiceBase}/api/v1/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!mlResponse.ok) {
      const detail = await mlResponse.text();
      return res.status(502).json({ error: "Recommendation service failed", detail });
    }

    const body = await mlResponse.json();
    const results = Array.isArray(body?.results) ? body.results : [];

    const jobById = new Map(
      jobsWithRecruiter.map((job) => [job._id.toString(), { ...job, applied: appliedIds.has(job._id.toString()) }]),
    );
    const recommendations = results
      .map((item) => {
        const job = jobById.get(item.jobId);
        if (!job) return null;
        return { job, score: item.score };
      })
      .filter(Boolean);

    return res.json({ recommendations, count: recommendations.length });
  } catch (err) {
    console.error("Failed to recommend jobs", err);
    return res.status(500).json({ error: "Failed to recommend jobs" });
  }
}

export async function recommendCandidatesForJob(req, res) {
  try {
    const recruiterId = req.user?._id;
    if (!recruiterId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const jobId = req.params?.jobId;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Invalid job id" });
    }

    const job = await Job.findOne({ _id: jobId, recruiterId }).lean();
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (!Array.isArray(job.embedding) || job.embedding.length === 0) {
      return res.status(400).json({ error: "Job embedding not available" });
    }

    const applications = await JobsApplied.find({ jobId: job._id })
      .sort({ createdAt: -1 })
      .populate({ path: "userId", select: "fullName email" })
      .lean();

    const candidateItems = applications
      .filter((app) => Array.isArray(app.resumeEmbedding) && app.resumeEmbedding.length)
      .map((app) => ({
        applicationId: app._id.toString(),
        candidateId: app.userId?._id?.toString(),
        candidateName: app.userId?.fullName,
        candidateEmail: app.userId?.email,
        submittedAt: app.createdAt,
        resumeEmbedding: app.resumeEmbedding,
      }));

    if (!candidateItems.length) {
      return res.status(404).json({ error: "No applications with resume embeddings found" });
    }

    const topKParam = Number.parseInt(req.query?.topK, 10);
    const maxK = Math.min(candidateItems.length, 200);
    const topK = Number.isFinite(topKParam) ? Math.min(Math.max(topKParam, 1), maxK) : Math.min(20, maxK);

    const payload = {
      // Reuse the recommendation endpoint by treating the job embedding as the query vector.
      resumeEmbedding: job.embedding,
      jobs: candidateItems.map((item) => ({
        jobId: item.applicationId,
        embedding: item.resumeEmbedding,
      })),
      topK,
    };

    const mlResponse = await fetch(`${mlServiceBase}/api/v1/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!mlResponse.ok) {
      const detail = await mlResponse.text();
      return res.status(502).json({ error: "Recommendation service failed", detail });
    }

    const body = await mlResponse.json();
    const results = Array.isArray(body?.results) ? body.results : [];

    const appsById = new Map(candidateItems.map((item) => [item.applicationId, item]));
    const recommendations = results
      .map((item) => {
        const match = appsById.get(item.jobId);
        if (!match) return null;
        return {
          applicationId: match.applicationId,
          candidateId: match.candidateId,
          candidateName: match.candidateName,
          candidateEmail: match.candidateEmail,
          submittedAt: match.submittedAt,
          score: item.score,
        };
      })
      .filter(Boolean);

    return res.json({
      jobId: job._id,
      jobTitle: job.title,
      totalApplications: candidateItems.length,
      recommendations,
      count: recommendations.length,
    });
  } catch (err) {
    console.error("Failed to recommend candidates", err);
    return res.status(500).json({ error: "Failed to recommend candidates" });
  }
}

export async function applyForJob(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const jobId = req.params?.jobId;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Invalid job id" });
    }

    const now = new Date();
    const job = await Job.findOne({
      _id: jobId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    }).lean();

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const resume = await Resume.findOne({ userId }).lean();
    if (!resume?.embedding) {
      return res.status(400).json({ error: "Upload a resume before applying" });
    }

    const origResume = await OrigResume.findOne({ userId }).lean();
    if (!origResume?.data) {
      return res.status(400).json({ error: "Original resume not found. Please re-upload." });
    }

    const { confirmation, additionalInfo = "", extra = {} } = req.body || {};
    const extraSafe = {
      phone: extra?.phone ? String(extra.phone) : "",
      linkedin: extra?.linkedin ? String(extra.linkedin) : "",
      portfolio: extra?.portfolio ? String(extra.portfolio) : "",
      location: extra?.location ? String(extra.location) : "",
      salaryExpectation: extra?.salaryExpectation ? String(extra.salaryExpectation) : "",
    };

    const application = await JobsApplied.findOneAndUpdate(
      { userId, jobId: job._id },
      {
        userId,
        jobId: job._id,
        jobTitle: job.title,
        recruiterId: job.recruiterId,
        status: "submitted",
        confirmation: Boolean(confirmation),
        additionalInfo: typeof additionalInfo === "string" ? additionalInfo : "",
        extra: extraSafe,
        resumeSnapshot: {
          fileName: origResume.fileName,
          mimeType: origResume.mimeType,
          size: origResume.size,
          data: origResume.data,
        },
        resumeEmbedding: resume.embedding,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(201).json({ applicationId: application._id, status: application.status });
  } catch (err) {
    console.error("Failed to apply for job", err);
    return res.status(500).json({ error: "Failed to apply for job" });
  }
}

export async function listApplicationsForRecruiter(req, res) {
  try {
    const recruiterId = req.user?._id;
    if (!recruiterId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const applications = await JobsApplied.find({ recruiterId })
      .sort({ createdAt: -1 })
      .populate({ path: "userId", select: "fullName email" })
      .lean();

    const jobIds = [...new Set(applications.map((a) => a.jobId.toString()))];
    const jobs = await Job.find({ _id: { $in: jobIds } }, { title: 1, workType: 1, location: 1, seniority: 1 }).lean();
    const jobById = new Map(jobs.map((j) => [j._id.toString(), j]));

    const payload = applications.map((app) => {
      const job = jobById.get(app.jobId.toString());
      return {
        id: app._id,
        jobId: app.jobId,
        jobTitle: app.jobTitle || job?.title,
        jobLocation: job?.location,
        jobWorkType: job?.workType,
        jobSeniority: job?.seniority,
        candidate: {
          id: app.userId?._id,
          name: app.userId?.fullName,
          email: app.userId?.email,
        },
        status: app.status,
        submittedAt: app.createdAt,
        confirmation: app.confirmation,
        additionalInfo: app.additionalInfo,
        extra: app.extra,
        resume: {
          fileName: app.resumeSnapshot?.fileName,
          mimeType: app.resumeSnapshot?.mimeType,
          size: app.resumeSnapshot?.size,
        },
      };
    });

    return res.json({ applications: payload });
  } catch (err) {
    console.error("Failed to list applications", err);
    return res.status(500).json({ error: "Failed to list applications" });
  }
}

export async function getApplicationResume(req, res) {
  try {
    const recruiterId = req.user?._id;
    if (!recruiterId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const applicationId = req.params?.applicationId;
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ error: "Invalid application id" });
    }

    const application = await JobsApplied.findOne({ _id: applicationId, recruiterId }).select("resumeSnapshot userId");
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Prefer stored snapshot; fallback to latest original resume for the candidate.
    const snapData = application.resumeSnapshot?.data;
    if (snapData) {
      const buffer = Buffer.isBuffer(snapData) ? snapData : Buffer.from(snapData);
      res.setHeader("Content-Type", application.resumeSnapshot.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `inline; filename="${application.resumeSnapshot.fileName || "resume"}"`);
      return res.send(buffer);
    }

    const orig = await OrigResume.findOne({ userId: application.userId }).lean();
    if (!orig?.data) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.setHeader("Content-Type", orig.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${orig.fileName}"`);
    return res.send(orig.data);
  } catch (err) {
    console.error("Failed to fetch application resume", err);
    return res.status(500).json({ error: "Failed to fetch application resume" });
  }
}
