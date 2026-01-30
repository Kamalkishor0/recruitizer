import { Router } from "express";
import { assignedTestToCandidate, getRecruiterOverview, getRecruiterAssignedTests, getTopCandidatesForTemplate, markTopCandidatesAsPassed } from "../controllers/assignedTest.js";
import { listRecruiterTemplates } from "../controllers/interviewTemplateController.js";
import { createJob, getApplicationResume, listApplicationsForRecruiter, listJobs, recommendCandidatesForJob } from "../controllers/job.js";
const router = Router();

router.post('/assign-test', assignedTestToCandidate);
router.post('/jobs', createJob);
router.get('/jobs', listJobs);
router.get('/jobs/:jobId/recommendations', recommendCandidatesForJob);
router.get('/applications', listApplicationsForRecruiter);
router.get('/applications/:applicationId/resume', getApplicationResume);
router.get('/overview', getRecruiterOverview);
router.get('/assigned-tests', getRecruiterAssignedTests);
router.get('/top-candidates', getTopCandidatesForTemplate);
router.post('/top-candidates/mark-passed', markTopCandidatesAsPassed);
router.get('/templates', listRecruiterTemplates);

export default router;