import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";
import interviewTemplateRouter from "./routes/interviewTemplate.js";
import questionsRouter from "./routes/questions.js";
import scoringRouter from "./routes/scoring.js";
import candidateRouter from "./routes/candidate.js";
import recruiterRouter from "./routes/recruiter.js";
import submissionsRouter from "./routes/submissions.js";
import { authenticate } from "./middlewares/authenticate.js";
import { authorize } from "./middlewares/role.js";
const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use(authenticate);
app.use("/scoring", scoringRouter);
app.use("/candidates", candidateRouter);
app.use("/recruiters", recruiterRouter);
app.use("/interview-templates", interviewTemplateRouter);
app.use("/questions", authorize("recruiter", "admin"), questionsRouter);
app.use("/submit", authorize("candidate"), submissionsRouter);
// Sample route
app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;