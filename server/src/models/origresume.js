import mongoose from "mongoose";

const { Schema } = mongoose;

const OrigResumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true, collection: "origresume" },
);

export default mongoose.model("OrigResume", OrigResumeSchema);
