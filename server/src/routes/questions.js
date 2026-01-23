import { Router } from "express";
import {
	createMultipleChoiceQuestion,
	deleteMultipleChoiceQuestion,
	getMultipleChoiceQuestions,
} from "../controllers/questions/multipleChoice.js";

const router = Router();
router.get("/multiple-choice", getMultipleChoiceQuestions);
router.post("/multiple-choice", createMultipleChoiceQuestion);
router.delete("/multiple-choice/:id", deleteMultipleChoiceQuestion);
export default router;