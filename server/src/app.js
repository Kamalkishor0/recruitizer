import express from "express";
import authRouter from "./routes/auth.js";

const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/auth", authRouter);

// Sample route
app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;