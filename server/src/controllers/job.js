import fetch from "node-fetch";
import Job from "../models/job.js";
import Resume from "../models/resume.js";

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
    const now = new Date();
    const jobs = await Job.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ jobs });
  } catch (err) {
    console.error("Failed to list jobs", err);
    return res.status(500).json({ error: "Failed to list jobs" });
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
      },
    )
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    if (!jobs.length) {
      return res.status(404).json({ error: "No active jobs available" });
    }

    const topKParam = Number.parseInt(req.query?.topK, 10);
    const topK = Number.isFinite(topKParam) ? Math.min(Math.max(topKParam, 1), 200) : 20;

    const payload = {
      resumeEmbedding: resume.embedding,
      jobs: jobs.map((job) => ({
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

    const jobById = new Map(jobs.map((job) => [job._id.toString(), job]));
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
