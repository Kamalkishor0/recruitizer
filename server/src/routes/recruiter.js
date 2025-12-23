import { Router } from "express";
import { assignedTestToCandidate } from "../controllers/assignedTest.js";
const router = Router();

router.post('/assign-test', assignedTestToCandidate);

export default router;