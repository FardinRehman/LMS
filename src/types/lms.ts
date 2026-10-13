/**
 * AcademiaOne Unified LMS - Core Domain Types and RBAC Models
 * Corresponds to PRD Sections 2, 3, 4, 10, 11, 12, 19, 28, 29
 */

export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT' | 'EXAMINER' | 'AUDITOR';

export type AccountStatus = 'INVITED' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: UserRole;
  secondaryRoles?: UserRole[];
  accountStatus: AccountStatus;
  avatarUrl?: string;
  departmentId?: string;
  // Student attributes
  studentId?: string;
  rollNumber?: string;
  programId?: string;
  semester?: number;
  sectionId?: string;
  biometricConsent: boolean;
  biometricConsentDate?: string;
  isCR?: boolean; // Class Representative delegation
  crSectionId?: string;
  // Faculty attributes
  staffId?: string;
  designation?: string;
  // Metadata
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headOfDepartment: string;
  totalStudents: number;
  totalFaculty: number;
}

export interface Program {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  degreeType: 'B.Tech' | 'B.Sc' | 'M.Tech' | 'MBA';
  durationYears: number;
  totalSemesters: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  programId: string;
  semester: number;
  credits: number;
  instructorId: string;
  instructorName: string;
  description: string;
  syllabus?: string[];
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
}

export interface Section {
  id: string;
  courseId: string;
  name: string; // e.g., "Section A"
  batchYear: number;
  roomNumber: string;
  crStudentId?: string; // Delegated Class Representative
  crStudentName?: string;
}

export interface ScheduledClass {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  sectionId: string;
  sectionName: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  room: string;
  status: 'SCHEDULED' | 'OPEN' | 'COMPLETED' | 'CANCELLED';
  activeAttendanceSessionId?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AttendanceMethod = 'MANUAL' | 'AI_PHOTO' | 'AI_VIDEO';
export type AttendanceSessionState = 'SCHEDULED' | 'OPEN' | 'REVIEW' | 'SUBMITTED_FINAL' | 'CORRECTED';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  scheduledClassId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  confidenceBand?: 'HIGH' | 'REVIEW' | 'UNMATCHED';
  confidenceScore?: number; // 0-100%
  aiCandidateId?: string;
  evidenceFaceBox?: { x: number; y: number; width: number; height: number };
  overrideReason?: string;
  finalizedBy: string;
  version: number;
  updatedAt: string;
}

export interface AttendanceSession {
  id: string;
  scheduledClassId: string;
  courseId: string;
  courseName: string;
  sectionId: string;
  sectionName: string;
  instructorId: string;
  operatorId: string; // Faculty ID or CR ID
  operatorName: string;
  operatorRole: 'FACULTY' | 'CR';
  date: string;
  state: AttendanceSessionState;
  method: AttendanceMethod;
  captureImageUrl?: string;
  rosterSnapshotCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  version: number;
  createdAt: string;
  finalizedAt?: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  attendanceRecordId: string;
  sessionId: string;
  scheduledClassId: string;
  courseName: string;
  classDate: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  currentStatus: AttendanceStatus;
  requestedStatus: AttendanceStatus;
  reason: string;
  evidenceNote?: string;
  status: 'REQUESTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  reviewerId?: string;
  reviewerName?: string;
  reviewerResponse?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface DetectedFace {
  id: string;
  box: { x: number; y: number; width: number; height: number };
  confidence: number;
  matchedStudentId?: string;
  matchedStudentName?: string;
  matchScore: number; // 0 to 1
  scoreBand: 'HIGH' | 'REVIEW' | 'UNMATCHED';
  qualityScore: number;
  qualityFlags: string[];
}

export interface AttendancePolicy {
  minimumAttendancePercent: number; // e.g. 85
  warningThresholdPercent: number; // e.g. 75
  lateCreditFraction: number; // e.g. 0.5 (half present)
  excusedCreditFraction: number; // e.g. 1.0
  correctionWindowHours: number; // e.g. 48
  aiAttendanceEnabled: boolean;
  videoSamplingEnabled: boolean;
  highConfidenceThreshold: number; // e.g. 0.85
  reviewConfidenceThreshold: number; // e.g. 0.65
  captureWindowMinutes: number; // e.g. 30
}

export interface Assessment {
  id: string;
  courseId: string;
  courseName: string;
  sectionId: string;
  title: string;
  type: 'ASSIGNMENT' | 'QUIZ' | 'MIDTERM' | 'FINAL_EXAM' | 'LAB';
  totalMarks: number;
  passMarks: number;
  dueDate: string;
  instructions: string;
  rubric: { criterion: string; maxPoints: number }[];
  status: 'DRAFT' | 'PUBLISHED' | 'EVALUATION' | 'RELEASED';
  submissionsCount: number;
}

export interface Submission {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt: string;
  content: string;
  fileName?: string;
  marksObtained?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  status: 'SUBMITTED' | 'GRADED' | 'RELEASED';
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  moduleName: string;
  type: 'VIDEO' | 'PDF' | 'SLIDES' | 'DOCUMENT';
  fileSize: string;
  duration?: string;
  url: string;
  publishedDate: string;
}

export interface DoubtThread {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  title: string;
  question: string;
  status: 'UNRESOLVED' | 'RESOLVED';
  replies: {
    id: string;
    authorName: string;
    authorRole: UserRole;
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: 'ALL' | 'STUDENT' | 'FACULTY';
  departmentId?: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface LMSNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'ATTENDANCE' | 'ASSESSMENT' | 'ANNOUNCEMENT' | 'SECURITY';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string; // e.g. "auth.login_success", "attendance.finalized", "rbac.user_created"
  targetEntity: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AIModelRelease {
  version: string;
  name: string;
  architecture: string;
  active: boolean;
  accuracyRate: number;
  falseMatchRate: number; // FMR
  falseNonMatchRate: number; // FNMR
  highConfidenceCutoff: number;
  reviewBandCutoff: number;
  releaseDate: string;
  approvedBy: string;
}
