import { Router } from "express";
import {
  createInterviewTemplate,
  listInterviewTemplates,
  getInterviewTemplateById,
  deleteInterviewTemplate,
} from "../controllers/interviewTemplateController.js";

const router = Router();

router.post("/", createInterviewTemplate);
router.get("/", listInterviewTemplates);
router.get("/:id", getInterviewTemplateById);
router.delete("/:id", deleteInterviewTemplate);

export default router;
