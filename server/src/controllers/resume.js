import FormData from "form-data";
import fetch from "node-fetch";
import Resume from "../models/resume.js";
import OrigResume from "../models/origresume.js";

const mlServiceBase = process.env.ML_SERVICE_URL || "http://localhost:8001";

export async function uploadResume(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    const allowedMimeTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const isAllowedMime = allowedMimeTypes.includes(file.mimetype);
    const hasAllowedExtension = file.originalname?.toLowerCase().endsWith(".pdf") || file.originalname?.toLowerCase().endsWith(".docx");

    if (!isAllowedMime || !hasAllowedExtension) {
      return res.status(400).json({ error: "Only PDF or DOCX resumes are allowed. Please reupload a PDF or DOCX file." });
    }

    await OrigResume.findOneAndUpdate(
      { userId },
      {
        userId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const form = new FormData();
    form.append("file", file.buffer, { filename: file.originalname, contentType: file.mimetype });

    const mlResponse = await fetch(`${mlServiceBase}/api/v1/resume/embed`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    if (!mlResponse.ok) {
      const detail = await mlResponse.text();
      return res.status(502).json({ error: "Embedding service failed", detail });
    }

    const body = await mlResponse.json();
    const embedding = body?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      return res.status(502).json({ error: "Embedding not returned" });
    }

    const saved = await Resume.findOneAndUpdate(
      { userId },
      {
        userId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        embedding,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.json({
      resume: {
        id: saved._id,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        size: saved.size,
        uploadedAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (err) {
    console.error("Failed to upload resume", err);
    return res.status(500).json({ error: "Failed to upload resume" });
  }
}

export async function getResume(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const resume = await Resume.findOne({ userId }).lean();
    if (!resume) {
      return res.status(404).json({ resume: null });
    }

    return res.json({
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        mimeType: resume.mimeType,
        size: resume.size,
        uploadedAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    });
  } catch (err) {
    console.error("Failed to fetch resume", err);
    return res.status(500).json({ error: "Failed to fetch resume" });
  }
}

export async function getResumeFile(req, res) {
  try {
    // Support userId from authenticated user OR from query param (for recruiter viewing candidate resume)
    let userId = req.user?._id;
    
    // If candidateId query param is provided and user is recruiter/admin, use that instead
    if (req.query.candidateId && req.user?.role && ["recruiter", "admin"].includes(req.user.role)) {
      userId = req.query.candidateId;
    }
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orig = await OrigResume.findOne({ userId });
    if (!orig || !orig.data) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.setHeader("Content-Type", orig.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${orig.fileName}"`);
    return res.send(orig.data);
  } catch (err) {
    console.error("Failed to fetch resume file", err);
    return res.status(500).json({ error: "Failed to fetch resume file" });
  }
}
