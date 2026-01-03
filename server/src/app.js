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

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use(authenticate);
app.use("/scoring", authorize("recruiter", "admin"), scoringRouter);
app.use("/candidates", authorize("candidate"), candidateRouter);
app.use("/recruiters", authorize("recruiter", "admin"), recruiterRouter);
app.use("/interview-templates", authorize("recruiter", "admin"), interviewTemplateRouter);
app.use("/questions", authorize("recruiter", "admin"), questionsRouter);
app.use("/submit", authorize("candidate"), submissionsRouter);

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;