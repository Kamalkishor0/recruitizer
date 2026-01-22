import { Router } from "express";
import { createMultipleChoiceQuestion, getMultipleChoiceQuestions } from "../controllers/questions/multipleChoice.js";

const router = Router();
router.get("/multiple-choice",getMultipleChoiceQuestions);
router.post("/multiple-choice", createMultipleChoiceQuestion);
export default router;