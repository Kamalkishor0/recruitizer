import { Router } from "express";
import { generateGeminiTemplatePreview, saveGeneratedTemplate } from "../controllers/ai/gemini.js";

const router = Router();

router.post("/generate-template", generateGeminiTemplatePreview);
router.post("/save-template", saveGeneratedTemplate);

export default router;
