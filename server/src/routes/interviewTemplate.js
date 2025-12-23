import { Router } from "express";
import {
  createInterviewTemplate,
  listInterviewTemplates,
  getInterviewTemplateById,
} from "../controllers/interviewTemplateController.js";

const router = Router();

router.post("/", createInterviewTemplate);
router.get("/", listInterviewTemplates);
router.get("/:id", getInterviewTemplateById);

export default router;
