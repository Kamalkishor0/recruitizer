import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { createTokenForUser } from "../utils/authentication.js";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    auth0UserId: { type: String, index: true },
    emailVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      default: "candidate",
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.statics.matchPasswordAndGenerateToken = async function matchPasswordAndGenerateToken(email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User not found");

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) throw new Error("Invalid password");

  return createTokenForUser(user);
};

const User = model("user", userSchema);
export { User };