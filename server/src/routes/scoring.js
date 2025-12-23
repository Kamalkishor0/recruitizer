import { Router } from "express";
import { scoringHandlerMCQ } from "../controllers/scoring.js";

const router = Router();

router.post("/assigned/:assignedTestId", scoringHandlerMCQ);

export default router;