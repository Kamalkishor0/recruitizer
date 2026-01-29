import mongoose from "mongoose";

const { Schema } = mongoose;

const ResumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Resume", ResumeSchema);
