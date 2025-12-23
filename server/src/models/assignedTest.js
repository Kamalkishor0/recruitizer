import { Schema, model } from "mongoose";
const assignedTestSchema = new Schema(
  {
    assignedId : { type: String, required: true, unique: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    interviewTemplate: { type: Schema.Types.ObjectId, ref: "interviewTemplate", required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    startTime: { type: Date },
    endTime: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

const AssignedTest = model("assignedTest", assignedTestSchema);
export { AssignedTest };
