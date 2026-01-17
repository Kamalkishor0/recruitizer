import { Router } from "express";
import { assignedTestToCandidate, getRecruiterOverview } from "../controllers/assignedTest.js";
const router = Router();

router.post('/assign-test', assignedTestToCandidate);
router.get('/overview', getRecruiterOverview);

export default router;