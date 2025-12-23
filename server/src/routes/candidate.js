import { Router } from "express";
import { getAssignedTestsForCandidate } from "../controllers/assignedTest.js";
import { startTest } from "../controllers/startTest.js";
import { finishTest } from "../controllers/finishTest.js";

const router = Router();

router.get("/assigned-test", getAssignedTestsForCandidate);
router.post("/start-test/:candidateId/:assignedTestId", startTest);
router.post("/finish-test/:candidateId/:assignedTestId", finishTest);

export default router;