import mongoose from "mongoose";

const { Schema } = mongoose;

const JobSchema = new Schema(
  {
    recruiterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: { type: String, default: "" },
    skills: { type: [String], default: [] },
    location: { type: String, default: "" },
    workType: { type: String, default: "" },
    seniority: { type: String, default: "" },
    embedding: { type: [Number], required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.model("Job", JobSchema);
