import { Schema, model } from "mongoose";

const questionSchema = new Schema(
  {
    testType: {
      type: String,
      enum: ["coding", "multiple_choice", "behavioral"],
      required: true,
    },
    prompt: { type: String, required: true },
    description: { type: String },
    options: [{ type: String }],
    correctOption: { type: Number },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    marks: { type: Number, default: 1 },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: true },
);

questionSchema.path("correctOption").validate(function validateCorrectOption(value) {
  if (this.testType !== "multiple_choice") return true;
  return typeof value === "number" && value >= 0;
}, "Multiple choice questions require a valid correct option index.");

const Question = model("questions", questionSchema);
export { Question };
