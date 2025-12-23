import mongoose from "mongoose";
const { Schema, model } = mongoose;

const submissionSchema = new Schema(
  {
    submissionId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    assignedTestId: {
      type: Schema.Types.ObjectId,
      ref: "assignedTest",
      required: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "questions",
      required: true,
    },
    answer: { type: String, required: true },
    score: { type: Number, default: 0 },
    feedback: { type: String },
    evaluated: { type: Boolean, default: false },
    isCorrect: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Submission = model("submission", submissionSchema);
export { Submission };