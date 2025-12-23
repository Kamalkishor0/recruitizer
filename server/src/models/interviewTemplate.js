import { Schema, model } from "mongoose";

const interviewTemplateSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    recruiterId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    testType: {
      type: String,
      enum: ["coding", "multiple_choice", "behavioral"],
      required: true,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "questions",
        required: true,
      },
    ],
    timeLimit: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
  },
  { timestamps: true },
);

const InterviewTemplate = model("interviewTemplate", interviewTemplateSchema);
export { InterviewTemplate };

