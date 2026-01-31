export type CandidateAssignment = {
  _id?: string;
  assignedId?: string;
  status: "pending" | "in_progress" | "completed" | "passed" | "failed";
  startTime?: string;
  endTime?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
  interviewTemplate?: {
    _id: string;
    title?: string;
    description?: string;
    testType?: "coding" | "multiple_choice" | "behavioral";
    timeLimit?: number;
    totalMarks?: number;
    questions?: Array<{
      _id?: string;
      prompt?: string;
      description?: string;
      options?: string[];
      marks?: number;
    }>;
  } | null;
};

export const ASSIGNMENT_STATUSES = ["pending", "in_progress", "completed", "passed", "failed"] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  pending: "Scheduled",
  in_progress: "Going on",
  completed: "Completed",
  passed: "Passed",
  failed: "Failed",
};

export const groupAssignmentsByStatus = (assignments: CandidateAssignment[]) => {
  return assignments.reduce<Record<AssignmentStatus, CandidateAssignment[]>>(
    (acc, item) => {
      const key = item.status as AssignmentStatus;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {
      pending: [],
      in_progress: [],
      completed: [],
      passed: [],
      failed: [],
    },
  );
};
