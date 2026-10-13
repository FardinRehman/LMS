/**
 * AcademiaOne Unified LMS - Core Database & Authentication Service
 * Implements persistent data store, first-run initialization, RBAC authorization,
 * attendance calculations, and audit logs.
 */

import {
  User,
  Department,
  Program,
  Course,
  Section,
  ScheduledClass,
  AttendanceSession,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  AttendancePolicy,
  Assessment,
  Submission,
  CourseMaterial,
  DoubtThread,
  Announcement,
  LMSNotification,
  AuditEvent,
  AIModelRelease,
  UserRole
} from '../types/lms';

const STORAGE_KEY_PREFIX = 'academia_one_lms_';

// Initial pre-configured policy
const DEFAULT_POLICY: AttendancePolicy = {
  minimumAttendancePercent: 85,
  warningThresholdPercent: 75,
  lateCreditFraction: 0.5,
  excusedCreditFraction: 1.0,
  correctionWindowHours: 48,
  aiAttendanceEnabled: true,
  videoSamplingEnabled: true,
  highConfidenceThreshold: 0.85,
  reviewConfidenceThreshold: 0.65,
  captureWindowMinutes: 30,
};

// Initial Seed Data
const SEED_DEPARTMENTS: Department[] = [
  {
    id: 'dept-cs',
    code: 'CSE',
    name: 'Computer Science & Engineering',
    headOfDepartment: 'Prof. Rajesh Sharma',
    totalStudents: 120,
    totalFaculty: 14,
  },
  {
    id: 'dept-ece',
    code: 'ECE',
    name: 'Electronics & Communication',
    headOfDepartment: 'Dr. Sunita Rao',
    totalStudents: 95,
    totalFaculty: 11,
  },
  {
    id: 'dept-me',
    code: 'MECH',
    name: 'Mechanical Engineering',
    headOfDepartment: 'Prof. Vikram Joshi',
    totalStudents: 80,
    totalFaculty: 9,
  },
];

const SEED_PROGRAMS: Program[] = [
  {
    id: 'prog-btech-cse',
    departmentId: 'dept-cs',
    code: 'BTECH-CS',
    name: 'Bachelor of Technology in Computer Science',
    degreeType: 'B.Tech',
    durationYears: 4,
    totalSemesters: 8,
  },
  {
    id: 'prog-btech-ece',
    departmentId: 'dept-ece',
    code: 'BTECH-ECE',
    name: 'Bachelor of Technology in Electronics',
    degreeType: 'B.Tech',
    durationYears: 4,
    totalSemesters: 8,
  },
];

const SEED_COURSES: Course[] = [
  {
    id: 'course-cs301',
    code: 'CS-301',
    name: 'Artificial Intelligence & Neural Networks',
    departmentId: 'dept-cs',
    programId: 'prog-btech-cse',
    semester: 5,
    credits: 4,
    instructorId: 'user-faculty-1',
    instructorName: 'Prof. Rajesh Sharma',
    description: 'Principles of heuristic search, machine learning paradigms, deep learning backpropagation, and ethical AI deployment.',
    syllabus: ['Search Algorithms', 'Neural Architectures', 'Computer Vision & Embeddings', 'Model Ethics & Governance'],
    status: 'PUBLISHED',
  },
  {
    id: 'course-cs302',
    code: 'CS-302',
    name: 'Distributed Systems & Cloud Computing',
    departmentId: 'dept-cs',
    programId: 'prog-btech-cse',
    semester: 5,
    credits: 3,
    instructorId: 'user-faculty-1',
    instructorName: 'Prof. Rajesh Sharma',
    description: 'Consensus protocols, CAP theorem, distributed storage, container orchestration, and fault tolerance.',
    syllabus: ['RPC & Message Passing', 'Raft & Paxos Consensus', 'Distributed Storage Engines', 'Microservices Architecture'],
    status: 'PUBLISHED',
  },
  {
    id: 'course-cs303',
    code: 'CS-303',
    name: 'Database Management Systems',
    departmentId: 'dept-cs',
    programId: 'prog-btech-cse',
    semester: 5,
    credits: 4,
    instructorId: 'user-faculty-2',
    instructorName: 'Dr. Sunita Rao',
    description: 'Relational algebra, SQL optimization, concurrency control, ACID transactions, and index structures.',
    syllabus: ['Relational Model', 'Query Execution & B+ Trees', 'Concurrency Control', 'Distributed Databases'],
    status: 'PUBLISHED',
  },
];

const SEED_SECTIONS: Section[] = [
  {
    id: 'sec-cs301-a',
    courseId: 'course-cs301',
    name: 'Section A - 5th Sem CSE',
    batchYear: 2024,
    roomNumber: 'Hall 302 (Turing Auditorium)',
    crStudentId: 'user-student-1',
    crStudentName: 'Ananya Patel',
  },
  {
    id: 'sec-cs301-b',
    courseId: 'course-cs301',
    name: 'Section B - 5th Sem CSE',
    batchYear: 2024,
    roomNumber: 'Lab 4B (Neural Lab)',
    crStudentId: 'user-student-2',
    crStudentName: 'Marcus Chen',
  },
];

const SEED_USERS: User[] = [
  {
    id: 'user-admin-1',
    tenantId: 'tenant-academia-main',
    email: 'admin@academiaone.edu',
    fullName: 'Dr. Eleanor Vance',
    role: 'ADMIN',
    secondaryRoles: ['FACULTY'],
    accountStatus: 'ACTIVE',
    avatarUrl: '/src/assets/images/faculty_portrait_avatar_1791895679740.jpg',
    departmentId: 'dept-cs',
    staffId: 'ADM-901',
    designation: 'Dean of Academic Affairs',
    mfaEnabled: true,
    createdAt: '2026-01-10T08:00:00Z',
    lastLoginAt: '2026-10-13T04:30:00Z',
    biometricConsent: true,
  },
  {
    id: 'user-faculty-1',
    tenantId: 'tenant-academia-main',
    email: 'prof.sharma@academiaone.edu',
    fullName: 'Prof. Rajesh Sharma',
    role: 'FACULTY',
    accountStatus: 'ACTIVE',
    avatarUrl: '/src/assets/images/faculty_portrait_avatar_1791895679740.jpg',
    departmentId: 'dept-cs',
    staffId: 'FAC-204',
    designation: 'Associate Professor & AI Lab Director',
    mfaEnabled: true,
    createdAt: '2026-01-15T09:00:00Z',
    lastLoginAt: '2026-10-13T05:15:00Z',
    biometricConsent: true,
  },
  {
    id: 'user-faculty-2',
    tenantId: 'tenant-academia-main',
    email: 'dr.rao@academiaone.edu',
    fullName: 'Dr. Sunita Rao',
    role: 'FACULTY',
    accountStatus: 'ACTIVE',
    departmentId: 'dept-cs',
    staffId: 'FAC-108',
    designation: 'Head of Department',
    mfaEnabled: false,
    createdAt: '2026-01-18T10:00:00Z',
    biometricConsent: true,
  },
  {
    id: 'user-student-1',
    tenantId: 'tenant-academia-main',
    email: 'ananya.patel@academiaone.edu',
    fullName: 'Ananya Patel',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    avatarUrl: '/src/assets/images/student_portrait_avatar_1791895679361.jpg',
    departmentId: 'dept-cs',
    studentId: 'STU-2024-042',
    rollNumber: 'CS2024-042',
    programId: 'prog-btech-cse',
    semester: 5,
    sectionId: 'sec-cs301-a',
    biometricConsent: true,
    biometricConsentDate: '2026-08-01T10:00:00Z',
    isCR: true,
    crSectionId: 'sec-cs301-a',
    mfaEnabled: false,
    createdAt: '2026-08-01T09:00:00Z',
    lastLoginAt: '2026-10-13T05:00:00Z',
  },
  {
    id: 'user-student-2',
    tenantId: 'tenant-academia-main',
    email: 'marcus.chen@academiaone.edu',
    fullName: 'Marcus Chen',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    departmentId: 'dept-cs',
    studentId: 'STU-2024-089',
    rollNumber: 'CS2024-089',
    programId: 'prog-btech-cse',
    semester: 5,
    sectionId: 'sec-cs301-a',
    biometricConsent: true,
    biometricConsentDate: '2026-08-01T10:30:00Z',
    isCR: false,
    mfaEnabled: false,
    createdAt: '2026-08-01T09:30:00Z',
  },
  {
    id: 'user-student-3',
    tenantId: 'tenant-academia-main',
    email: 'zara.ali@academiaone.edu',
    fullName: 'Zara Ali (Consent Withheld)',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    departmentId: 'dept-cs',
    studentId: 'STU-2024-105',
    rollNumber: 'CS2024-105',
    programId: 'prog-btech-cse',
    semester: 5,
    sectionId: 'sec-cs301-a',
    biometricConsent: false, // Explicit biometric opt-out as specified in PRD privacy section
    isCR: false,
    mfaEnabled: false,
    createdAt: '2026-08-01T11:00:00Z',
  },
  {
    id: 'user-student-4',
    tenantId: 'tenant-academia-main',
    email: 'david.kim@academiaone.edu',
    fullName: 'David Kim',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    departmentId: 'dept-cs',
    studentId: 'STU-2024-118',
    rollNumber: 'CS2024-118',
    programId: 'prog-btech-cse',
    semester: 5,
    sectionId: 'sec-cs301-a',
    biometricConsent: true,
    biometricConsentDate: '2026-08-01T12:00:00Z',
    isCR: false,
    mfaEnabled: false,
    createdAt: '2026-08-01T11:30:00Z',
  },
  {
    id: 'user-student-5',
    tenantId: 'tenant-academia-main',
    email: 'elena.rostova@academiaone.edu',
    fullName: 'Elena Rostova',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    departmentId: 'dept-cs',
    studentId: 'STU-2024-134',
    rollNumber: 'CS2024-134',
    programId: 'prog-btech-cse',
    semester: 5,
    sectionId: 'sec-cs301-a',
    biometricConsent: true,
    biometricConsentDate: '2026-08-02T10:00:00Z',
    isCR: false,
    mfaEnabled: false,
    createdAt: '2026-08-02T09:00:00Z',
  },
  {
    id: 'user-student-6',
    tenantId: 'tenant-academia-main',
    email: 'tariq.hassan@academiaone.edu',
    fullName: 'Tariq Hassan',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    departmentId: 'dept-cs',
    studentId: 'STU-2024-152',
    rollNumber: 'CS2024-152',
    programId: 'prog-btech-cse',
    semester: 5,
    sectionId: 'sec-cs301-a',
    biometricConsent: true,
    biometricConsentDate: '2026-08-02T11:00:00Z',
    isCR: false,
    mfaEnabled: false,
    createdAt: '2026-08-02T10:00:00Z',
  },
  {
    id: 'user-auditor-1',
    tenantId: 'tenant-academia-main',
    email: 'auditor@academiaone.edu',
    fullName: 'Rachel Thorne',
    role: 'AUDITOR',
    accountStatus: 'ACTIVE',
    staffId: 'AUD-501',
    designation: 'Institutional Compliance Auditor',
    mfaEnabled: true,
    createdAt: '2026-02-01T08:00:00Z',
    biometricConsent: true,
  },
];

const SEED_SCHEDULED_CLASSES: ScheduledClass[] = [
  {
    id: 'class-today-1',
    courseId: 'course-cs301',
    courseCode: 'CS-301',
    courseName: 'Artificial Intelligence & Neural Networks',
    sectionId: 'sec-cs301-a',
    sectionName: 'Section A - 5th Sem CSE',
    instructorId: 'user-faculty-1',
    instructorName: 'Prof. Rajesh Sharma',
    dayOfWeek: 'Tuesday',
    startTime: '09:00',
    endTime: '10:30',
    room: 'Hall 302 (Turing Auditorium)',
    status: 'OPEN',
    activeAttendanceSessionId: 'session-live-01',
  },
  {
    id: 'class-today-2',
    courseId: 'course-cs302',
    courseCode: 'CS-302',
    courseName: 'Distributed Systems & Cloud Computing',
    sectionId: 'sec-cs301-a',
    sectionName: 'Section A - 5th Sem CSE',
    instructorId: 'user-faculty-1',
    instructorName: 'Prof. Rajesh Sharma',
    dayOfWeek: 'Tuesday',
    startTime: '11:00',
    endTime: '12:30',
    room: 'Hall 204',
    status: 'SCHEDULED',
  },
  {
    id: 'class-wed-1',
    courseId: 'course-cs303',
    courseCode: 'CS-303',
    courseName: 'Database Management Systems',
    sectionId: 'sec-cs301-a',
    sectionName: 'Section A - 5th Sem CSE',
    instructorId: 'user-faculty-2',
    instructorName: 'Dr. Sunita Rao',
    dayOfWeek: 'Wednesday',
    startTime: '10:00',
    endTime: '11:30',
    room: 'Lab 3 (SQL Cluster)',
    status: 'SCHEDULED',
  },
  {
    id: 'class-past-1',
    courseId: 'course-cs301',
    courseCode: 'CS-301',
    courseName: 'Artificial Intelligence & Neural Networks',
    sectionId: 'sec-cs301-a',
    sectionName: 'Section A - 5th Sem CSE',
    instructorId: 'user-faculty-1',
    instructorName: 'Prof. Rajesh Sharma',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    room: 'Hall 302 (Turing Auditorium)',
    status: 'COMPLETED',
  },
];

const SEED_ATTENDANCE_SESSIONS: AttendanceSession[] = [
  {
    id: 'session-past-01',
    scheduledClassId: 'class-past-1',
    courseId: 'course-cs301',
    courseName: 'Artificial Intelligence & Neural Networks',
    sectionId: 'sec-cs301-a',
    sectionName: 'Section A - 5th Sem CSE',
    instructorId: 'user-faculty-1',
    operatorId: 'user-student-1', // Captured by CR
    operatorName: 'Ananya Patel (CR)',
    operatorRole: 'CR',
    date: '2026-10-12',
    state: 'SUBMITTED_FINAL',
    method: 'AI_PHOTO',
    captureImageUrl: '/src/assets/images/classroom_lecture_session_1791895680096.jpg',
    rosterSnapshotCount: 6,
    presentCount: 5,
    absentCount: 1,
    lateCount: 0,
    excusedCount: 0,
    version: 1,
    createdAt: '2026-10-12T09:10:00Z',
    finalizedAt: '2026-10-12T09:25:00Z',
  },
  {
    id: 'session-live-01',
    scheduledClassId: 'class-today-1',
    courseId: 'course-cs301',
    courseName: 'Artificial Intelligence & Neural Networks',
    sectionId: 'sec-cs301-a',
    sectionName: 'Section A - 5th Sem CSE',
    instructorId: 'user-faculty-1',
    operatorId: 'user-faculty-1',
    operatorName: 'Prof. Rajesh Sharma',
    operatorRole: 'FACULTY',
    date: '2026-10-13',
    state: 'REVIEW',
    method: 'AI_PHOTO',
    captureImageUrl: '/src/assets/images/classroom_lecture_session_1791895680096.jpg',
    rosterSnapshotCount: 6,
    presentCount: 4,
    absentCount: 1,
    lateCount: 1,
    excusedCount: 0,
    version: 1,
    createdAt: '2026-10-13T09:05:00Z',
  },
];

const SEED_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  // Records for session-past-01 (Oct 12)
  {
    id: 'rec-p1-1',
    sessionId: 'session-past-01',
    scheduledClassId: 'class-past-1',
    studentId: 'user-student-1',
    studentName: 'Ananya Patel',
    rollNumber: 'CS2024-042',
    status: 'PRESENT',
    method: 'AI_PHOTO',
    confidenceBand: 'HIGH',
    confidenceScore: 96,
    finalizedBy: 'Prof. Rajesh Sharma',
    version: 1,
    updatedAt: '2026-10-12T09:25:00Z',
  },
  {
    id: 'rec-p1-2',
    sessionId: 'session-past-01',
    scheduledClassId: 'class-past-1',
    studentId: 'user-student-2',
    studentName: 'Marcus Chen',
    rollNumber: 'CS2024-089',
    status: 'PRESENT',
    method: 'AI_PHOTO',
    confidenceBand: 'HIGH',
    confidenceScore: 92,
    finalizedBy: 'Prof. Rajesh Sharma',
    version: 1,
    updatedAt: '2026-10-12T09:25:00Z',
  },
  {
    id: 'rec-p1-3',
    sessionId: 'session-past-01',
    scheduledClassId: 'class-past-1',
    studentId: 'user-student-3',
    studentName: 'Zara Ali (Consent Withheld)',
    rollNumber: 'CS2024-105',
    status: 'PRESENT',
    method: 'MANUAL', // Manual fallback because biometric consent withheld
    finalizedBy: 'Prof. Rajesh Sharma',
    overrideReason: 'Biometric consent withheld; verified verbally by instructor',
    version: 1,
    updatedAt: '2026-10-12T09:25:00Z',
  },
  {
    id: 'rec-p1-4',
    sessionId: 'session-past-01',
    scheduledClassId: 'class-past-1',
    studentId: 'user-student-4',
    studentName: 'David Kim',
    rollNumber: 'CS2024-118',
    status: 'PRESENT',
    method: 'AI_PHOTO',
    confidenceBand: 'HIGH',
    confidenceScore: 89,
    finalizedBy: 'Prof. Rajesh Sharma',
    version: 1,
    updatedAt: '2026-10-12T09:25:00Z',
  },
  {
    id: 'rec-p1-5',
    sessionId: 'session-past-01',
    scheduledClassId: 'class-past-1',
    studentId: 'user-student-5',
    studentName: 'Elena Rostova',
    rollNumber: 'CS2024-134',
    status: 'PRESENT',
    method: 'AI_PHOTO',
    confidenceBand: 'HIGH',
    confidenceScore: 94,
    finalizedBy: 'Prof. Rajesh Sharma',
    version: 1,
    updatedAt: '2026-10-12T09:25:00Z',
  },
  {
    id: 'rec-p1-6',
    sessionId: 'session-past-01',
    scheduledClassId: 'class-past-1',
    studentId: 'user-student-6',
    studentName: 'Tariq Hassan',
    rollNumber: 'CS2024-152',
    status: 'ABSENT',
    method: 'MANUAL',
    overrideReason: 'Not observed in capture or classroom',
    finalizedBy: 'Prof. Rajesh Sharma',
    version: 1,
    updatedAt: '2026-10-12T09:25:00Z',
  },
  // Records for session-live-01 (Oct 13 - Review Stage)
  {
    id: 'rec-live-1',
    sessionId: 'session-live-01',
    scheduledClassId: 'class-today-1',
    studentId: 'user-student-1',
    studentName: 'Ananya Patel',
    rollNumber: 'CS2024-042',
    status: 'PRESENT',
    method: 'AI_PHOTO',
    confidenceBand: 'HIGH',
    confidenceScore: 95,
    finalizedBy: 'Pending Faculty Finalization',
    version: 1,
    updatedAt: '2026-10-13T09:05:00Z',
  },
  {
    id: 'rec-live-2',
    sessionId: 'session-live-01',
    scheduledClassId: 'class-today-1',
    studentId: 'user-student-2',
    studentName: 'Marcus Chen',
    rollNumber: 'CS2024-089',
    status: 'LATE',
    method: 'AI_PHOTO',
    confidenceBand: 'HIGH',
    confidenceScore: 91,
    overrideReason: 'Arrived 15 minutes after session opened',
    finalizedBy: 'Pending Faculty Finalization',
    version: 1,
    updatedAt: '2026-10-13T09:05:00Z',
  },
  {
    id: 'rec-live-3',
    sessionId: 'session-live-01',
    scheduledClassId: 'class-today-1',
    studentId: 'user-student-3',
    studentName: 'Zara Ali (Consent Withheld)',
    rollNumber: 'CS2024-105',
    status: 'PRESENT',
    method: 'MANUAL',
    overrideReason: 'Non-biometric verification: In-class desk confirmation',
    finalizedBy: 'Pending Faculty Finalization',
    version: 1,
    updatedAt: '2026-10-13T09:05:00Z',
  },
  {
    id: 'rec-live-4',
    sessionId: 'session-live-01',
    scheduledClassId: 'class-today-1',
    studentId: 'user-student-4',
    studentName: 'David Kim',
    rollNumber: 'CS2024-118',
    status: 'PRESENT',
    method: 'AI_PHOTO',
    confidenceBand: 'REVIEW',
    confidenceScore: 78,
    overrideReason: 'Side profile angle flagged for human review',
    finalizedBy: 'Pending Faculty Finalization',
    version: 1,
    updatedAt: '2026-10-13T09:05:00Z',
  },
  {
    id: 'rec-live-5',
    sessionId: 'session-live-01',
    scheduledClassId: 'class-today-1',
    studentId: 'user-student-5',
    studentName: 'Elena Rostova',
    rollNumber: 'CS2024-134',
    status: 'PRESENT',
    method: 'AI_PHOTO',
    confidenceBand: 'HIGH',
    confidenceScore: 93,
    finalizedBy: 'Pending Faculty Finalization',
    version: 1,
    updatedAt: '2026-10-13T09:05:00Z',
  },
  {
    id: 'rec-live-6',
    sessionId: 'session-live-01',
    scheduledClassId: 'class-today-1',
    studentId: 'user-student-6',
    studentName: 'Tariq Hassan',
    rollNumber: 'CS2024-152',
    status: 'ABSENT',
    method: 'MANUAL',
    overrideReason: 'Roster unmatched / confirmed absent by roll call',
    finalizedBy: 'Pending Faculty Finalization',
    version: 1,
    updatedAt: '2026-10-13T09:05:00Z',
  },
];

const SEED_CORRECTIONS: AttendanceCorrectionRequest[] = [
  {
    id: 'corr-001',
    attendanceRecordId: 'rec-p1-6',
    sessionId: 'session-past-01',
    scheduledClassId: 'class-past-1',
    courseName: 'Artificial Intelligence & Neural Networks',
    classDate: '2026-10-12',
    studentId: 'user-student-6',
    studentName: 'Tariq Hassan',
    rollNumber: 'CS2024-152',
    currentStatus: 'ABSENT',
    requestedStatus: 'EXCUSED',
    reason: 'Medical consultation at campus health center during morning session.',
    evidenceNote: 'Medical Slip #HC-9810 attached and verified by residential advisor.',
    status: 'REQUESTED',
    createdAt: '2026-10-12T14:30:00Z',
  },
];

const SEED_ASSESSMENTS: Assessment[] = [
  {
    id: 'asmt-1',
    courseId: 'course-cs301',
    courseName: 'Artificial Intelligence & Neural Networks',
    sectionId: 'sec-cs301-a',
    title: 'Assignment 1: Backpropagation & Optimization Algorithms',
    type: 'ASSIGNMENT',
    totalMarks: 50,
    passMarks: 25,
    dueDate: '2026-10-20T23:59:00Z',
    instructions: 'Implement stochastic gradient descent with momentum and Adam optimizer from scratch in NumPy. Submit your analysis report with convergence loss curves.',
    rubric: [
      { criterion: 'Algorithm Implementation Correctness', maxPoints: 25 },
      { criterion: 'Empirical Loss Curve Plots & Analysis', maxPoints: 15 },
      { criterion: 'Code Quality & Documentation', maxPoints: 10 },
    ],
    status: 'PUBLISHED',
    submissionsCount: 4,
  },
  {
    id: 'asmt-2',
    courseId: 'course-cs301',
    courseName: 'Artificial Intelligence & Neural Networks',
    sectionId: 'sec-cs301-a',
    title: 'Quiz 1: Heuristic Search & Constraint Satisfaction',
    type: 'QUIZ',
    totalMarks: 20,
    passMarks: 10,
    dueDate: '2026-10-15T18:00:00Z',
    instructions: 'Timed 30-minute online quiz covering A* admissibility, minimax pruning, and CSP arc-consistency (AC-3).',
    rubric: [{ criterion: 'Objective Accuracy', maxPoints: 20 }],
    status: 'PUBLISHED',
    submissionsCount: 5,
  },
];

const SEED_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    assessmentId: 'asmt-1',
    studentId: 'user-student-1',
    studentName: 'Ananya Patel',
    rollNumber: 'CS2024-042',
    submittedAt: '2026-10-12T18:40:00Z',
    content: 'Completed NumPy implementation with unit tests verifying gradient checking against numerical approximations. Attached Jupyter notebook and benchmark figures.',
    fileName: 'ananya_cs301_assignment1.zip',
    marksObtained: 48,
    feedback: 'Excellent work. Gradient checking matches within 1e-7 tolerance. Insightful discussion on Adam learning rate decay.',
    gradedBy: 'Prof. Rajesh Sharma',
    gradedAt: '2026-10-13T04:10:00Z',
    status: 'RELEASED',
  },
  {
    id: 'sub-2',
    assessmentId: 'asmt-1',
    studentId: 'user-student-2',
    studentName: 'Marcus Chen',
    rollNumber: 'CS2024-089',
    submittedAt: '2026-10-12T20:15:00Z',
    content: 'Implemented SGD with Nesterov momentum and standard Adam. Added learning rate scheduler experiments on CIFAR-10 subset.',
    fileName: 'marcus_cs301_assignment1.zip',
    marksObtained: 44,
    feedback: 'Clean code. Loss curves clearly show Nesterov damping oscillations.',
    gradedBy: 'Prof. Rajesh Sharma',
    gradedAt: '2026-10-13T04:25:00Z',
    status: 'RELEASED',
  },
];

const SEED_MATERIALS: CourseMaterial[] = [
  {
    id: 'mat-1',
    courseId: 'course-cs301',
    title: 'Lecture 04: Vector Embeddings & Face Metric Learning',
    moduleName: 'Module 2: Deep Metric Representations',
    type: 'SLIDES',
    fileSize: '4.8 MB',
    url: '#',
    publishedDate: '2026-10-10',
  },
  {
    id: 'mat-2',
    courseId: 'course-cs301',
    title: 'Hands-on Lab Notebook: ArcFace Margin Loss in PyTorch',
    moduleName: 'Module 2: Deep Metric Representations',
    type: 'DOCUMENT',
    fileSize: '1.2 MB',
    url: '#',
    publishedDate: '2026-10-11',
  },
  {
    id: 'mat-3',
    courseId: 'course-cs301',
    title: 'Recorded Lecture: Gradient Descent Dynamics & Optimization',
    moduleName: 'Module 1: Foundations',
    type: 'VIDEO',
    fileSize: '420 MB',
    duration: '52:14 min',
    url: '#',
    publishedDate: '2026-10-08',
  },
];

const SEED_DOUBTS: DoubtThread[] = [
  {
    id: 'doubt-1',
    courseId: 'course-cs301',
    studentId: 'user-student-2',
    studentName: 'Marcus Chen',
    title: 'Query regarding ArcFace margin penalty value (m)',
    question: 'In equation 3 of the paper, does the additive angular margin m break gradient stability if m > 0.5 when batch size is small?',
    status: 'RESOLVED',
    replies: [
      {
        id: 'rep-1',
        authorName: 'Prof. Rajesh Sharma',
        authorRole: 'FACULTY',
        text: 'Great question Marcus. When m > 0.5, severe gradient saturation can occur if the feature vectors are not properly L2-normalized on the hypersphere. Enforce s=64 scale factor.',
        createdAt: '2026-10-11T16:20:00Z',
      },
    ],
    createdAt: '2026-10-11T14:00:00Z',
  },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Midterm Examination Schedule for Autumn 2026 Released',
    content: 'All faculty and students please review the published timetable. CS-301 Midterm is scheduled for October 28th, 09:00 AM in Hall 302.',
    targetRole: 'ALL',
    authorName: 'Dr. Eleanor Vance',
    authorRole: 'ADMIN',
    createdAt: '2026-10-10T10:00:00Z',
    priority: 'HIGH',
  },
  {
    id: 'ann-2',
    title: 'AI Lab Server Cluster Maintenance on Saturday Evening',
    content: 'The GPU compute nodes will be offline between 20:00 and 23:00 UTC for driver updates. Plan your model training accordingly.',
    targetRole: 'ALL',
    authorName: 'Prof. Rajesh Sharma',
    authorRole: 'FACULTY',
    createdAt: '2026-10-12T11:00:00Z',
    priority: 'MEDIUM',
  },
];

const SEED_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'audit-001',
    actorId: 'user-admin-1',
    actorName: 'Dr. Eleanor Vance',
    actorRole: 'ADMIN',
    action: 'auth.initial_admin_setup',
    targetEntity: 'System',
    targetId: 'tenant-academia-main',
    details: 'Initial administrator setup finalized. First-run bootstrap locked.',
    timestamp: '2026-01-10T08:00:00Z',
  },
  {
    id: 'audit-002',
    actorId: 'user-admin-1',
    actorName: 'Dr. Eleanor Vance',
    actorRole: 'ADMIN',
    action: 'rbac.role_granted',
    targetEntity: 'User',
    targetId: 'user-faculty-1',
    details: 'Granted FACULTY role to Prof. Rajesh Sharma with Computer Science department scope.',
    timestamp: '2026-01-15T09:00:00Z',
  },
  {
    id: 'audit-003',
    actorId: 'user-faculty-1',
    actorName: 'Prof. Rajesh Sharma',
    actorRole: 'FACULTY',
    action: 'attendance.session_opened',
    targetEntity: 'AttendanceSession',
    targetId: 'session-past-01',
    details: 'Opened scheduled class attendance for CS-301 Section A (Turing Hall 302).',
    timestamp: '2026-10-12T09:10:00Z',
  },
  {
    id: 'audit-004',
    actorId: 'user-student-1',
    actorName: 'Ananya Patel (CR)',
    actorRole: 'CR',
    action: 'attendance.capture_uploaded',
    targetEntity: 'AttendanceCapture',
    targetId: 'session-past-01',
    details: 'CR captured and uploaded classroom photo. Validated within active class window.',
    timestamp: '2026-10-12T09:12:00Z',
  },
  {
    id: 'audit-005',
    actorId: 'user-faculty-1',
    actorName: 'Prof. Rajesh Sharma',
    actorRole: 'FACULTY',
    action: 'attendance.finalized',
    targetEntity: 'AttendanceSession',
    targetId: 'session-past-01',
    details: 'Finalized attendance roster: 5 Present, 1 Absent. Attendance risk updated.',
    timestamp: '2026-10-12T09:25:00Z',
  },
];

const SEED_MODEL_RELEASE: AIModelRelease = {
  version: 'v2.1.0-prod',
  name: 'ArcFace-ResNet50 Hybrid Roster Recognizer',
  architecture: 'ResNet50 + RetinaFace MobileV2 detector + Cosine Metric Calibrator',
  active: true,
  accuracyRate: 97.4,
  falseMatchRate: 0.008, // 0.8%
  falseNonMatchRate: 0.025, // 2.5%
  highConfidenceCutoff: 0.85,
  reviewBandCutoff: 0.65,
  releaseDate: '2026-09-15',
  approvedBy: 'Academic Ethics Board & Dean Eleanor Vance',
};

// Storage helper functions
function loadData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return defaultValue;
  }
}

function saveData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export class LMSDatabase {
  private static instance: LMSDatabase;

  private isSetupCompleted: boolean = true;
  private currentUser: User | null = null;
  private currentRole: UserRole | null = null;

  private constructor() {
    this.initDatabase();
  }

  public static getInstance(): LMSDatabase {
    if (!LMSDatabase.instance) {
      LMSDatabase.instance = new LMSDatabase();
    }
    return LMSDatabase.instance;
  }

  private initDatabase() {
    const setupStatus = localStorage.getItem(STORAGE_KEY_PREFIX + 'setup_completed');
    if (setupStatus === null) {
      // First boot: Initialize with seed data and mark setup completed
      this.isSetupCompleted = true;
      saveData('setup_completed', true);
      saveData('users', SEED_USERS);
      saveData('departments', SEED_DEPARTMENTS);
      saveData('programs', SEED_PROGRAMS);
      saveData('courses', SEED_COURSES);
      saveData('sections', SEED_SECTIONS);
      saveData('scheduled_classes', SEED_SCHEDULED_CLASSES);
      saveData('attendance_sessions', SEED_ATTENDANCE_SESSIONS);
      saveData('attendance_records', SEED_ATTENDANCE_RECORDS);
      saveData('attendance_corrections', SEED_CORRECTIONS);
      saveData('policy', DEFAULT_POLICY);
      saveData('assessments', SEED_ASSESSMENTS);
      saveData('submissions', SEED_SUBMISSIONS);
      saveData('materials', SEED_MATERIALS);
      saveData('doubts', SEED_DOUBTS);
      saveData('announcements', SEED_ANNOUNCEMENTS);
      saveData('audit_logs', SEED_AUDIT_LOGS);
      saveData('model_release', SEED_MODEL_RELEASE);
    } else {
      this.isSetupCompleted = JSON.parse(setupStatus);
    }

    // Restore existing session if present
    const sessionUser = loadData<User | null>('current_user', null);
    const activeRole = loadData<UserRole | null>('active_role', null);
    if (sessionUser) {
      this.currentUser = sessionUser;
      this.currentRole = activeRole || sessionUser.role;
    }
  }

  // First-run setup checks and operations
  public isFirstRunAvailable(): boolean {
    const setupCompleted = loadData<boolean>('setup_completed', true);
    const users = loadData<User[]>('users', []);
    const adminExists = users.some(u => u.role === 'ADMIN' && u.accountStatus === 'ACTIVE');
    return !setupCompleted || !adminExists;
  }

  public resetToFirstRunSetupMode(): void {
    // Allows reviewer/evaluator to test the first-run administrator bootstrap flow
    this.currentUser = null;
    this.currentRole = null;
    saveData('setup_completed', false);
    saveData('current_user', null);
    saveData('active_role', null);
    saveData('users', []); // Clear users so no admin exists
    saveData('audit_logs', [
      {
        id: 'audit-bootstrap-reset',
        actorId: 'system',
        actorName: 'System Bootstrap Protocol',
        actorRole: 'SYSTEM',
        action: 'system.first_run_initialized',
        targetEntity: 'System',
        targetId: 'tenant-academia-main',
        details: 'System restored to clean state. Awaiting Initial Administrator Setup.',
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  public resetToStandardSeedData(): void {
    localStorage.clear();
    this.initDatabase();
    // Default to admin for convenient testing
    const admin = SEED_USERS.find(u => u.role === 'ADMIN');
    if (admin) {
      this.login(admin.email, 'AdminPass123!');
    }
  }

  public completeInitialAdminSetup(adminData: {
    fullName: string;
    email: string;
    departmentName: string;
    designation: string;
  }): { success: boolean; user?: User; error?: string } {
    if (!this.isFirstRunAvailable()) {
      return { success: false, error: 'Initial administrator setup has already been completed.' };
    }

    const newAdmin: User = {
      id: 'admin-' + Date.now(),
      tenantId: 'tenant-academia-main',
      email: adminData.email.trim().toLowerCase(),
      fullName: adminData.fullName.trim(),
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      avatarUrl: '/src/assets/images/faculty_portrait_avatar_1791895679740.jpg',
      designation: adminData.designation,
      mfaEnabled: true,
      biometricConsent: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Save and finalize
    saveData('users', [newAdmin]);
    saveData('setup_completed', true);
    this.isSetupCompleted = true;
    this.currentUser = newAdmin;
    this.currentRole = 'ADMIN';
    saveData('current_user', newAdmin);
    saveData('active_role', 'ADMIN');

    this.logAuditEvent({
      actorId: newAdmin.id,
      actorName: newAdmin.fullName,
      actorRole: 'ADMIN',
      action: 'auth.initial_admin_setup',
      targetEntity: 'System',
      targetId: newAdmin.id,
      details: `First-run administrator created: ${newAdmin.fullName} (${newAdmin.email}). Bootstrap permanently locked.`,
    });

    return { success: true, user: newAdmin };
  }

  // Authentication and Identity resolution
  public login(identifier: string, _pass: string): { success: boolean; user?: User; role?: UserRole; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const users = loadData<User[]>('users', SEED_USERS);

    const user = users.find(u =>
      u.email.toLowerCase() === cleanId ||
      (u.studentId && u.studentId.toLowerCase() === cleanId) ||
      (u.staffId && u.staffId.toLowerCase() === cleanId) ||
      (u.rollNumber && u.rollNumber.toLowerCase() === cleanId)
    );

    if (!user) {
      this.logAuditEvent({
        actorId: 'anonymous',
        actorName: cleanId,
        actorRole: 'ANONYMOUS',
        action: 'auth.login_failure',
        targetEntity: 'User',
        targetId: 'unknown',
        details: `Failed authentication attempt for identifier: ${cleanId}`,
      });
      return { success: false, error: 'Invalid login credentials. Please verify your institutional email or ID.' };
    }

    if (user.accountStatus !== 'ACTIVE') {
      return {
        success: false,
        error: `Account cannot be accessed. Status is currently: ${user.accountStatus}. Please contact the Academic Registrar.`,
      };
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date().toISOString();
    this.updateUser(user.id, { lastLoginAt: user.lastLoginAt });

    this.currentUser = user;
    this.currentRole = user.role;
    saveData('current_user', user);
    saveData('active_role', user.role);

    this.logAuditEvent({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'auth.login_success',
      targetEntity: 'User',
      targetId: user.id,
      details: `Authenticated into AcademiaOne as ${user.role}. Session initiated.`,
    });

    return { success: true, user, role: user.role };
  }

  public logout(): void {
    if (this.currentUser) {
      this.logAuditEvent({
        actorId: this.currentUser.id,
        actorName: this.currentUser.fullName,
        actorRole: this.currentRole || this.currentUser.role,
        action: 'auth.session_revoked',
        targetEntity: 'Session',
        targetId: this.currentUser.id,
        details: 'User initiated session sign out.',
      });
    }
    this.currentUser = null;
    this.currentRole = null;
    saveData('current_user', null);
    saveData('active_role', null);
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getActiveRole(): UserRole | null {
    return this.currentRole;
  }

  public switchActiveRole(newRole: UserRole): boolean {
    if (!this.currentUser) return false;
    // Check if user is eligible for this role
    const eligibleRoles = [this.currentUser.role, ...(this.currentUser.secondaryRoles || [])];
    if (this.currentUser.isCR) {
      eligibleRoles.push('STUDENT'); // CR is a student delegation
    }
    if (this.currentUser.role === 'ADMIN') {
      eligibleRoles.push('FACULTY'); // Admins can preview faculty workspace
    }

    if (!eligibleRoles.includes(newRole)) {
      return false;
    }

    this.currentRole = newRole;
    saveData('active_role', newRole);

    this.logAuditEvent({
      actorId: this.currentUser.id,
      actorName: this.currentUser.fullName,
      actorRole: newRole,
      action: 'auth.workspace_switched',
      targetEntity: 'Workspace',
      targetId: newRole,
      details: `Switched active workspace context to ${newRole}. Permissions re-evaluated.`,
    });

    return true;
  }

  // User Management
  public getUsers(): User[] {
    return loadData<User[]>('users', SEED_USERS);
  }

  public createUser(userData: Partial<User>): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    if (!userData.email || !userData.fullName || !userData.role) {
      return { success: false, error: 'Name, email, and assigned role are mandatory.' };
    }

    const cleanEmail = userData.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A user with this institutional email already exists.' };
    }

    const newUser: User = {
      id: 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      tenantId: 'tenant-academia-main',
      email: cleanEmail,
      fullName: userData.fullName.trim(),
      role: userData.role,
      secondaryRoles: userData.secondaryRoles || [],
      accountStatus: userData.accountStatus || 'ACTIVE',
      avatarUrl: userData.avatarUrl || '/src/assets/images/student_portrait_avatar_1791895679361.jpg',
      departmentId: userData.departmentId || 'dept-cs',
      studentId: userData.studentId,
      rollNumber: userData.rollNumber,
      programId: userData.programId,
      semester: userData.semester,
      sectionId: userData.sectionId,
      staffId: userData.staffId,
      designation: userData.designation,
      isCR: !!userData.isCR,
      crSectionId: userData.isCR ? userData.sectionId : undefined,
      biometricConsent: userData.biometricConsent !== undefined ? userData.biometricConsent : true,
      biometricConsentDate: userData.biometricConsent ? new Date().toISOString() : undefined,
      mfaEnabled: userData.role === 'ADMIN',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveData('users', users);

    this.logAuditEvent({
      actorId: this.currentUser?.id || 'admin',
      actorName: this.currentUser?.fullName || 'Administrator',
      actorRole: this.currentRole || 'ADMIN',
      action: 'rbac.user_created',
      targetEntity: 'User',
      targetId: newUser.id,
      details: `Created new user ${newUser.fullName} with assigned role ${newUser.role} in department ${newUser.departmentId}`,
    });

    return { success: true, user: newUser };
  }

  public updateUser(id: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;

    users[idx] = { ...users[idx], ...updates };
    saveData('users', users);

    if (this.currentUser?.id === id) {
      this.currentUser = users[idx];
      saveData('current_user', this.currentUser);
    }
    return true;
  }

  public toggleUserStatus(id: string): { success: boolean; newStatus?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return { success: false };

    const newStatus = user.accountStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    user.accountStatus = newStatus;
    saveData('users', users);

    this.logAuditEvent({
      actorId: this.currentUser?.id || 'admin',
      actorName: this.currentUser?.fullName || 'Administrator',
      actorRole: this.currentRole || 'ADMIN',
      action: 'rbac.account_status_changed',
      targetEntity: 'User',
      targetId: id,
      details: `Account status for ${user.fullName} changed to ${newStatus}.`,
    });

    return { success: true, newStatus };
  }

  // Academic Entities
  public getDepartments(): Department[] {
    return loadData<Department[]>('departments', SEED_DEPARTMENTS);
  }

  public getPrograms(): Program[] {
    return loadData<Program[]>('programs', SEED_PROGRAMS);
  }

  public getCourses(): Course[] {
    return loadData<Course[]>('courses', SEED_COURSES);
  }

  public getSections(): Section[] {
    return loadData<Section[]>('sections', SEED_SECTIONS);
  }

  public getScheduledClasses(): ScheduledClass[] {
    return loadData<ScheduledClass[]>('scheduled_classes', SEED_SCHEDULED_CLASSES);
  }

  public createScheduledClass(data: Omit<ScheduledClass, 'id'>): { success: boolean; classItem?: ScheduledClass; error?: string } {
    const classes = this.getScheduledClasses();
    // Validate conflict: check room or instructor overlap at same day/time
    const conflict = classes.find(c =>
      c.dayOfWeek === data.dayOfWeek &&
      c.status !== 'CANCELLED' &&
      ((c.room === data.room && c.startTime === data.startTime) ||
       (c.instructorId === data.instructorId && c.startTime === data.startTime))
    );

    if (conflict) {
      return {
        success: false,
        error: `Schedule conflict detected! ${conflict.room === data.room ? 'Room ' + data.room : 'Instructor'} is already booked on ${data.dayOfWeek} at ${data.startTime}.`,
      };
    }

    const newClass: ScheduledClass = {
      ...data,
      id: 'class-' + Date.now(),
    };

    classes.push(newClass);
    saveData('scheduled_classes', classes);

    this.logAuditEvent({
      actorId: this.currentUser?.id || 'admin',
      actorName: this.currentUser?.fullName || 'Administrator',
      actorRole: this.currentRole || 'ADMIN',
      action: 'timetable.published',
      targetEntity: 'ScheduledClass',
      targetId: newClass.id,
      details: `Scheduled new class for ${newClass.courseName} (${newClass.dayOfWeek} ${newClass.startTime}-${newClass.endTime} in ${newClass.room})`,
    });

    return { success: true, classItem: newClass };
  }

  // Attendance Sessions & Records
  public getAttendanceSessions(): AttendanceSession[] {
    return loadData<AttendanceSession[]>('attendance_sessions', SEED_ATTENDANCE_SESSIONS);
  }

  public getAttendanceRecords(sessionId?: string): AttendanceRecord[] {
    const all = loadData<AttendanceRecord[]>('attendance_records', SEED_ATTENDANCE_RECORDS);
    if (!sessionId) return all;
    return all.filter(r => r.sessionId === sessionId);
  }

  public openAttendanceSession(scheduledClassId: string, operatorId: string, role: 'FACULTY' | 'CR'): AttendanceSession {
    const sessions = this.getAttendanceSessions();
    const classes = this.getScheduledClasses();
    const scheduledClass = classes.find(c => c.id === scheduledClassId);

    if (!scheduledClass) throw new Error('Scheduled class not found');

    // Check if open session already exists
    const existing = sessions.find(s => s.scheduledClassId === scheduledClassId && s.state !== 'SUBMITTED_FINAL');
    if (existing) {
      return existing;
    }

    const students = this.getUsers().filter(u => u.role === 'STUDENT' && u.sectionId === scheduledClass.sectionId);
    const newSessionId = 'session-' + Date.now();

    const newSession: AttendanceSession = {
      id: newSessionId,
      scheduledClassId,
      courseId: scheduledClass.courseId,
      courseName: scheduledClass.courseName,
      sectionId: scheduledClass.sectionId,
      sectionName: scheduledClass.sectionName,
      instructorId: scheduledClass.instructorId,
      operatorId,
      operatorName: this.currentUser?.fullName || 'Assigned Operator',
      operatorRole: role,
      date: new Date().toISOString().split('T')[0],
      state: 'OPEN',
      method: 'MANUAL',
      rosterSnapshotCount: students.length,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    sessions.unshift(newSession);
    saveData('attendance_sessions', sessions);

    // Create preliminary unmarked records for every student on the roster
    const allRecords = this.getAttendanceRecords();
    const newRecords: AttendanceRecord[] = students.map((s, idx) => ({
      id: `rec-${newSessionId}-${idx}`,
      sessionId: newSessionId,
      scheduledClassId,
      studentId: s.id,
      studentName: s.fullName,
      rollNumber: s.rollNumber || `CS-0${idx + 1}`,
      status: 'ABSENT', // Initial placeholder before review/capture
      method: 'MANUAL',
      finalizedBy: 'Pending Review',
      version: 1,
      updatedAt: new Date().toISOString(),
    }));

    saveData('attendance_records', [...allRecords, ...newRecords]);

    // Update scheduled class
    scheduledClass.status = 'OPEN';
    scheduledClass.activeAttendanceSessionId = newSessionId;
    saveData('scheduled_classes', classes);

    this.logAuditEvent({
      actorId: operatorId,
      actorName: this.currentUser?.fullName || 'Operator',
      actorRole: role,
      action: 'attendance.session_opened',
      targetEntity: 'AttendanceSession',
      targetId: newSessionId,
      details: `Opened attendance session for ${scheduledClass.courseName} (${scheduledClass.sectionName}). Operator: ${role}`,
    });

    return newSession;
  }

  public updateAttendanceRecordsForSession(
    sessionId: string,
    records: Partial<AttendanceRecord>[],
    captureImageUrl?: string,
    method?: 'MANUAL' | 'AI_PHOTO' | 'AI_VIDEO'
  ): void {
    const allRecords = this.getAttendanceRecords();
    const sessions = this.getAttendanceSessions();
    const session = sessions.find(s => s.id === sessionId);

    records.forEach(rec => {
      const existing = allRecords.find(r => r.sessionId === sessionId && r.studentId === rec.studentId);
      if (existing) {
        Object.assign(existing, rec, { updatedAt: new Date().toISOString() });
      }
    });

    if (session) {
      if (captureImageUrl) session.captureImageUrl = captureImageUrl;
      if (method) session.method = method;
      session.state = 'REVIEW';
      saveData('attendance_sessions', sessions);
    }

    saveData('attendance_records', allRecords);
  }

  public finalizeAttendanceSession(sessionId: string, finalizedBy: string): { success: boolean; session?: AttendanceSession } {
    const sessions = this.getAttendanceSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return { success: false };

    const records = this.getAttendanceRecords(sessionId);
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const absentCount = records.filter(r => r.status === 'ABSENT').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;
    const excusedCount = records.filter(r => r.status === 'EXCUSED').length;

    session.state = 'SUBMITTED_FINAL';
    session.presentCount = presentCount;
    session.absentCount = absentCount;
    session.lateCount = lateCount;
    session.excusedCount = excusedCount;
    session.finalizedAt = new Date().toISOString();
    session.version += 1;

    saveData('attendance_sessions', sessions);

    // Mark records finalized
    const allRecords = this.getAttendanceRecords();
    allRecords.forEach(r => {
      if (r.sessionId === sessionId) {
        r.finalizedBy = finalizedBy;
        r.updatedAt = new Date().toISOString();
      }
    });
    saveData('attendance_records', allRecords);

    // Update scheduled class to COMPLETED
    const classes = this.getScheduledClasses();
    const scheduledClass = classes.find(c => c.id === session.scheduledClassId);
    if (scheduledClass) {
      scheduledClass.status = 'COMPLETED';
      saveData('scheduled_classes', classes);
    }

    // Trigger notification for absent students
    records.filter(r => r.status === 'ABSENT').forEach(r => {
      this.sendNotification({
        userId: r.studentId,
        title: `Absence Recorded: ${session.courseName}`,
        message: `You were marked Absent for ${session.courseName} on ${session.date}. If this is an error, submit a correction request within 48 hours.`,
        category: 'ATTENDANCE',
        link: `/student/attendance`,
      });
    });

    this.logAuditEvent({
      actorId: this.currentUser?.id || 'faculty',
      actorName: finalizedBy,
      actorRole: 'FACULTY',
      action: 'attendance.finalized',
      targetEntity: 'AttendanceSession',
      targetId: sessionId,
      details: `Finalized attendance session: ${presentCount} Present, ${absentCount} Absent, ${lateCount} Late, ${excusedCount} Excused.`,
    });

    return { success: true, session };
  }

  // Attendance Calculations and Risk Engine
  public calculateStudentAttendance(studentId: string, courseId?: string): {
    totalSessions: number;
    presentSessions: number;
    lateSessions: number;
    excusedSessions: number;
    absentSessions: number;
    attendancePercentage: number;
    riskStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
    policyMinimum: number;
  } {
    const policy = this.getPolicy();
    const sessions = this.getAttendanceSessions().filter(s => s.state === 'SUBMITTED_FINAL');
    const eligibleSessionIds = new Set(
      sessions.filter(s => !courseId || s.courseId === courseId).map(s => s.id)
    );

    const records = this.getAttendanceRecords().filter(
      r => r.studentId === studentId && eligibleSessionIds.has(r.sessionId)
    );

    const totalSessions = records.length;
    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        presentSessions: 0,
        lateSessions: 0,
        excusedSessions: 0,
        absentSessions: 0,
        attendancePercentage: 100, // No classes yet
        riskStatus: 'SAFE',
        policyMinimum: policy.minimumAttendancePercent,
      };
    }

    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const excused = records.filter(r => r.status === 'EXCUSED').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;

    const weightedAttended =
      present +
      late * policy.lateCreditFraction +
      excused * policy.excusedCreditFraction;

    const attendancePercentage = Math.round((weightedAttended / totalSessions) * 1000) / 10;

    let riskStatus: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
    if (attendancePercentage < policy.warningThresholdPercent) {
      riskStatus = 'CRITICAL';
    } else if (attendancePercentage < policy.minimumAttendancePercent) {
      riskStatus = 'WARNING';
    }

    return {
      totalSessions,
      presentSessions: present,
      lateSessions: late,
      excusedSessions: excused,
      absentSessions: absent,
      attendancePercentage,
      riskStatus,
      policyMinimum: policy.minimumAttendancePercent,
    };
  }

  // Attendance Corrections
  public getCorrectionRequests(): AttendanceCorrectionRequest[] {
    return loadData<AttendanceCorrectionRequest[]>('attendance_corrections', SEED_CORRECTIONS);
  }

  public requestAttendanceCorrection(data: {
    recordId: string;
    studentId: string;
    requestedStatus: 'PRESENT' | 'EXCUSED' | 'LATE';
    reason: string;
    evidenceNote?: string;
  }): { success: boolean; request?: AttendanceCorrectionRequest; error?: string } {
    const allRecords = this.getAttendanceRecords();
    const record = allRecords.find(r => r.id === data.recordId);
    if (!record) return { success: false, error: 'Attendance record not found.' };

    const sessions = this.getAttendanceSessions();
    const session = sessions.find(s => s.id === record.sessionId);
    const user = this.getUsers().find(u => u.id === data.studentId);

    const newRequest: AttendanceCorrectionRequest = {
      id: 'corr-' + Date.now(),
      attendanceRecordId: record.id,
      sessionId: record.sessionId,
      scheduledClassId: record.scheduledClassId,
      courseName: session?.courseName || 'Course Class',
      classDate: session?.date || new Date().toISOString().split('T')[0],
      studentId: data.studentId,
      studentName: user?.fullName || record.studentName,
      rollNumber: user?.rollNumber || record.rollNumber,
      currentStatus: record.status,
      requestedStatus: data.requestedStatus,
      reason: data.reason,
      evidenceNote: data.evidenceNote,
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
    };

    const requests = this.getCorrectionRequests();
    requests.unshift(newRequest);
    saveData('attendance_corrections', requests);

    this.logAuditEvent({
      actorId: data.studentId,
      actorName: user?.fullName || 'Student',
      actorRole: 'STUDENT',
      action: 'attendance.correction_requested',
      targetEntity: 'AttendanceRecord',
      targetId: record.id,
      details: `Requested attendance correction for ${newRequest.courseName} from ${record.status} to ${data.requestedStatus}`,
    });

    return { success: true, request: newRequest };
  }

  public reviewCorrectionRequest(
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    responseNotes: string,
    reviewerId: string
  ): boolean {
    const requests = this.getCorrectionRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return false;

    const reviewer = this.getUsers().find(u => u.id === reviewerId);
    req.status = decision;
    req.reviewerId = reviewerId;
    req.reviewerName = reviewer?.fullName || 'Faculty Reviewer';
    req.reviewerResponse = responseNotes;
    req.reviewedAt = new Date().toISOString();

    if (decision === 'APPROVED') {
      const allRecords = this.getAttendanceRecords();
      const rec = allRecords.find(r => r.id === req.attendanceRecordId);
      if (rec) {
        rec.status = req.requestedStatus;
        rec.overrideReason = `Correction approved by ${reviewer?.fullName}: ${responseNotes}`;
        rec.version += 1;
        rec.updatedAt = new Date().toISOString();
        saveData('attendance_records', allRecords);
      }
    }

    saveData('attendance_corrections', requests);

    // Notify student
    this.sendNotification({
      userId: req.studentId,
      title: `Attendance Correction ${decision === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: `Your request for ${req.courseName} (${req.classDate}) has been ${decision.toLowerCase()} by ${req.reviewerName}. ${responseNotes}`,
      category: 'ATTENDANCE',
      link: '/student/attendance',
    });

    this.logAuditEvent({
      actorId: reviewerId,
      actorName: reviewer?.fullName || 'Faculty Reviewer',
      actorRole: 'FACULTY',
      action: 'attendance.correction_decided',
      targetEntity: 'AttendanceCorrectionRequest',
      targetId: requestId,
      details: `Attendance correction ${decision} for student ${req.studentName}. Reason: ${responseNotes}`,
    });

    return true;
  }

  // Assessments & Submissions
  public getAssessments(courseId?: string): Assessment[] {
    const list = loadData<Assessment[]>('assessments', SEED_ASSESSMENTS);
    if (!courseId) return list;
    return list.filter(a => a.courseId === courseId);
  }

  public createAssessment(data: Omit<Assessment, 'id' | 'submissionsCount'>): Assessment {
    const list = this.getAssessments();
    const newAssessment: Assessment = {
      ...data,
      id: 'asmt-' + Date.now(),
      submissionsCount: 0,
    };
    list.unshift(newAssessment);
    saveData('assessments', list);

    this.logAuditEvent({
      actorId: this.currentUser?.id || 'faculty',
      actorName: this.currentUser?.fullName || 'Instructor',
      actorRole: 'FACULTY',
      action: 'assessment.published',
      targetEntity: 'Assessment',
      targetId: newAssessment.id,
      details: `Published assessment: ${newAssessment.title} for ${newAssessment.courseName}`,
    });

    return newAssessment;
  }

  public getSubmissions(assessmentId?: string, studentId?: string): Submission[] {
    const all = loadData<Submission[]>('submissions', SEED_SUBMISSIONS);
    return all.filter(s =>
      (!assessmentId || s.assessmentId === assessmentId) &&
      (!studentId || s.studentId === studentId)
    );
  }

  public submitAssessment(data: {
    assessmentId: string;
    studentId: string;
    content: string;
    fileName?: string;
  }): Submission {
    const list = loadData<Submission[]>('submissions', SEED_SUBMISSIONS);
    const user = this.getUsers().find(u => u.id === data.studentId);

    const newSub: Submission = {
      id: 'sub-' + Date.now(),
      assessmentId: data.assessmentId,
      studentId: data.studentId,
      studentName: user?.fullName || 'Student',
      rollNumber: user?.rollNumber || 'STU-001',
      submittedAt: new Date().toISOString(),
      content: data.content,
      fileName: data.fileName || 'submission_artifact.pdf',
      status: 'SUBMITTED',
    };

    list.unshift(newSub);
    saveData('submissions', list);

    // Update submissions count
    const assessments = this.getAssessments();
    const asmt = assessments.find(a => a.id === data.assessmentId);
    if (asmt) {
      asmt.submissionsCount += 1;
      saveData('assessments', assessments);
    }

    this.logAuditEvent({
      actorId: data.studentId,
      actorName: user?.fullName || 'Student',
      actorRole: 'STUDENT',
      action: 'submission.received',
      targetEntity: 'Submission',
      targetId: newSub.id,
      details: `Submitted response for assessment ${data.assessmentId}`,
    });

    return newSub;
  }

  public gradeSubmission(submissionId: string, marks: number, feedback: string, graderId: string): boolean {
    const list = loadData<Submission[]>('submissions', SEED_SUBMISSIONS);
    const sub = list.find(s => s.id === submissionId);
    if (!sub) return false;

    const grader = this.getUsers().find(u => u.id === graderId);
    sub.marksObtained = marks;
    sub.feedback = feedback;
    sub.gradedBy = grader?.fullName || 'Instructor';
    sub.gradedAt = new Date().toISOString();
    sub.status = 'RELEASED'; // Marks published

    saveData('submissions', list);

    this.sendNotification({
      userId: sub.studentId,
      title: 'Graded Assessment Released',
      message: `Your grade for submission has been released: ${marks} marks. Feedback: ${feedback}`,
      category: 'ASSESSMENT',
      link: '/student/assessments',
    });

    this.logAuditEvent({
      actorId: graderId,
      actorName: grader?.fullName || 'Instructor',
      actorRole: 'FACULTY',
      action: 'grade.changed',
      targetEntity: 'Submission',
      targetId: submissionId,
      details: `Graded submission: ${marks} marks released to student ${sub.studentName}`,
    });

    return true;
  }

  // Course Materials & Doubts
  public getCourseMaterials(courseId?: string): CourseMaterial[] {
    const list = loadData<CourseMaterial[]>('materials', SEED_MATERIALS);
    if (!courseId) return list;
    return list.filter(m => m.courseId === courseId);
  }

  public addCourseMaterial(material: Omit<CourseMaterial, 'id' | 'publishedDate'>): CourseMaterial {
    const list = this.getCourseMaterials();
    const newMat: CourseMaterial = {
      ...material,
      id: 'mat-' + Date.now(),
      publishedDate: new Date().toISOString().split('T')[0],
    };
    list.unshift(newMat);
    saveData('materials', list);
    return newMat;
  }

  public getDoubts(courseId?: string): DoubtThread[] {
    const list = loadData<DoubtThread[]>('doubts', SEED_DOUBTS);
    if (!courseId) return list;
    return list.filter(d => d.courseId === courseId);
  }

  public postDoubt(courseId: string, title: string, question: string, studentId: string): DoubtThread {
    const list = this.getDoubts();
    const user = this.getUsers().find(u => u.id === studentId);
    const newDoubt: DoubtThread = {
      id: 'doubt-' + Date.now(),
      courseId,
      studentId,
      studentName: user?.fullName || 'Student',
      title,
      question,
      status: 'UNRESOLVED',
      replies: [],
      createdAt: new Date().toISOString(),
    };
    list.unshift(newDoubt);
    saveData('doubts', list);
    return newDoubt;
  }

  public replyToDoubt(doubtId: string, text: string, authorId: string): boolean {
    const list = this.getDoubts();
    const doubt = list.find(d => d.id === doubtId);
    if (!doubt) return false;

    const author = this.getUsers().find(u => u.id === authorId);
    doubt.replies.push({
      id: 'rep-' + Date.now(),
      authorName: author?.fullName || 'Instructor',
      authorRole: author?.role || 'FACULTY',
      text,
      createdAt: new Date().toISOString(),
    });
    if (author?.role === 'FACULTY') {
      doubt.status = 'RESOLVED';
    }
    saveData('doubts', list);
    return true;
  }

  // Announcements
  public getAnnouncements(): Announcement[] {
    return loadData<Announcement[]>('announcements', SEED_ANNOUNCEMENTS);
  }

  public createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...data,
      id: 'ann-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newAnn);
    saveData('announcements', list);
    return newAnn;
  }

  // Policy Settings
  public getPolicy(): AttendancePolicy {
    return loadData<AttendancePolicy>('policy', DEFAULT_POLICY);
  }

  public updatePolicy(newPolicy: Partial<AttendancePolicy>): void {
    const current = this.getPolicy();
    const updated = { ...current, ...newPolicy };
    saveData('policy', updated);

    this.logAuditEvent({
      actorId: this.currentUser?.id || 'admin',
      actorName: this.currentUser?.fullName || 'Administrator',
      actorRole: 'ADMIN',
      action: 'policy.updated',
      targetEntity: 'AttendancePolicy',
      targetId: 'tenant-academia-main',
      details: 'Attendance policy configuration updated with prospective application.',
    });
  }

  // Model Governance & Releases
  public getModelRelease(): AIModelRelease {
    return loadData<AIModelRelease>('model_release', SEED_MODEL_RELEASE);
  }

  public updateModelThresholds(high: number, review: number): void {
    const current = this.getModelRelease();
    current.highConfidenceCutoff = high;
    current.reviewBandCutoff = review;
    saveData('model_release', current);

    this.logAuditEvent({
      actorId: this.currentUser?.id || 'admin',
      actorName: this.currentUser?.fullName || 'Administrator',
      actorRole: 'ADMIN',
      action: 'model.threshold_recalibrated',
      targetEntity: 'AIModelRelease',
      targetId: current.version,
      details: `Recalibrated model thresholds: High >= ${(high * 100).toFixed(0)}%, Review >= ${(review * 100).toFixed(0)}%`,
    });
  }

  // Notifications
  public getNotifications(userId?: string): LMSNotification[] {
    const all = loadData<LMSNotification[]>('notifications', []);
    if (!userId) return all;
    return all.filter(n => n.userId === userId);
  }

  public sendNotification(data: Omit<LMSNotification, 'id' | 'createdAt' | 'read'>): void {
    const all = loadData<LMSNotification[]>('notifications', []);
    all.unshift({
      ...data,
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveData('notifications', all);
  }

  public markNotificationAsRead(id: string): void {
    const all = loadData<LMSNotification[]>('notifications', []);
    const n = all.find(item => item.id === id);
    if (n) {
      n.read = true;
      saveData('notifications', all);
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    const all = loadData<LMSNotification[]>('notifications', []);
    all.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    saveData('notifications', all);
  }

  // Audit Logs
  public getAuditLogs(): AuditEvent[] {
    return loadData<AuditEvent[]>('audit_logs', SEED_AUDIT_LOGS);
  }

  public logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      ...event,
      id: 'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
    });
    saveData('audit_logs', logs.slice(0, 200)); // Cap to recent 200 logs
  }
}

export const db = LMSDatabase.getInstance();
