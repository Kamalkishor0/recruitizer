import { Router } from "express";
import { assignedTestToCandidate, getRecruiterOverview, getRecruiterAssignedTests, getTopCandidatesForTemplate, markTopCandidatesAsPassed } from "../controllers/assignedTest.js";
import { listRecruiterTemplates } from "../controllers/interviewTemplateController.js";
const router = Router();

router.post('/assign-test', assignedTestToCandidate);
router.get('/overview', getRecruiterOverview);
router.get('/assigned-tests', getRecruiterAssignedTests);
router.get('/top-candidates', getTopCandidatesForTemplate);
router.post('/top-candidates/mark-passed', markTopCandidatesAsPassed);
router.get('/templates', listRecruiterTemplates);

export default router;