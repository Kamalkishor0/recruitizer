import { Router } from "express";
import multer from "multer";
import { getAssignedTestsForCandidate } from "../controllers/assignedTest.js";
import { startTest } from "../controllers/startTest.js";
import { finishTest } from "../controllers/finishTest.js";
import { getResume, getResumeFile, uploadResume } from "../controllers/resume.js";
import { applyForJob, getJobById, listJobs, recommendJobsForCandidate } from "../controllers/job.js";

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.get("/assigned-test", getAssignedTestsForCandidate);
router.get("/jobs", listJobs);
router.get("/jobs/:jobId", getJobById);
router.get("/recommendations", recommendJobsForCandidate);
router.post("/jobs/:jobId/apply", applyForJob);
router.post("/start-test/:candidateId/:assignedTestId", startTest);
router.post("/finish-test/:candidateId/:assignedTestId", finishTest);
router.get("/resume", getResume);
router.get("/resume/file", getResumeFile);
router.post("/resume", upload.single("file"), uploadResume);

export default router;