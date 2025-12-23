import { Router } from "express";
import { submitAnswer } from "../controllers/submission.js";

const router = Router();

router.post("/:assignedTestId/:questionId", submitAnswer);

export default router;