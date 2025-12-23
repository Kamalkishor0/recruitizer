import { AssignedTest } from "../models/assignedTest.js";

export async function finishTest(req, res) {
  const { assignedTestId } = req.params;

  if (!assignedTestId) {
    return res.status(400).json({ error: "assignedTestId is required" });
  }

  const assignedTest = await AssignedTest.findOne({ assignedId: assignedTestId });
  if (!assignedTest) {
    return res.status(404).json({ error: "Assigned test not found" });
  }

  const candidateId = req.user?._id?.toString();
  if (candidateId && assignedTest.candidateId.toString() !== candidateId) {
    return res.status(403).json({ error: "Cannot finalize another candidate's test" });
  }

  if (assignedTest.status !== "in_progress") {
    return res.status(400).json({ error: "Test is not currently in progress" });
  }

  assignedTest.status = "completed";
  assignedTest.endTime = new Date();
  await assignedTest.save();

  return res.status(200).json({ message: "Test marked as completed" });
}
