import mongoose from "mongoose";

const { Schema } = mongoose;

const ExtraSchema = new Schema(
  {
    phone: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    location: { type: String, default: "" },
    salaryExpectation: { type: String, default: "" },
  },
  { _id: false },
);

const ResumeSnapshotSchema = new Schema(
  {
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { _id: false },
);

const JobsAppliedSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    jobTitle: { type: String, required: true },
    recruiterId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    status: { type: String, default: "submitted" },
    confirmation: { type: Boolean, default: false },
    additionalInfo: { type: String, default: "" },
    extra: { type: ExtraSchema, default: () => ({}) },
    resumeSnapshot: { type: ResumeSnapshotSchema, required: true },
    resumeEmbedding: { type: [Number], required: true },
  },
  { timestamps: true, collection: "jobsapplied" },
);

JobsAppliedSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export default mongoose.model("JobsApplied", JobsAppliedSchema);
