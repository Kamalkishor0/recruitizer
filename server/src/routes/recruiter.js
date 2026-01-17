import { Router } from "express";
import { assignedTestToCandidate, getRecruiterOverview, getRecruiterAssignedTests } from "../controllers/assignedTest.js";
const router = Router();

router.post('/assign-test', assignedTestToCandidate);
router.get('/overview', getRecruiterOverview);
router.get('/assigned-tests', getRecruiterAssignedTests);

export default router;