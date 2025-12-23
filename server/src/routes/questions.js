import { Router } from "express";
import {
  createMultipleChoiceQuestion,
  getMultipleChoiceQuestions
//   codingQuestions,
//   behavioralQuestions,
} from "../controllers/questions/multipleChoice.js";

const router = Router();
router.get("/multiple-choice",getMultipleChoiceQuestions);
router.post("/multiple-choice", createMultipleChoiceQuestion);
// router.post("/coding", codingQuestions);
// router.post("/behavioral", behavioralQuestions);

export default router;