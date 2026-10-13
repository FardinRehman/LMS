import React from 'react';
import { db } from '../../services/db';
import { User } from '../../types/lms';
import {
  Calendar,
  Camera,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const scheduledClasses = db.getScheduledClasses();
  const nextClass = scheduledClasses.find(c => c.status === 'OPEN' || c.status === 'SCHEDULED');
  const attendanceCalc = db.calculateStudentAttendance(currentUser.id);
  const assessments = db.getAssessments();
  const submissions = db.getSubmissions(undefined, currentUser.id);

  // Unsubmitted assignments
  const pendingAssignments = assessments.filter(
    a => !submissions.some(s => s.assessmentId === a.id)
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Student Hero Banner */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <span>Student Academic Workspace</span>
            <span className="text-neutral-300">·</span>
            <span>Roll No: {currentUser.rollNumber || 'CS2024-042'}</span>
            {currentUser.isCR && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="text-indigo-600 font-bold">Class Representative (CR)</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Welcome, {currentUser.fullName}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Computer Science & Engineering · Semester 5 · Section A (Autumn 2026)
          </p>
        </div>

        {currentUser.isCR && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('student-cr-capture')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              CR Classroom Capture Mode
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Percentage & Risk Status */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Overall Attendance</span>
            <Camera className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              {attendanceCalc.attendancePercentage}%
            </span>
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
              attendanceCalc.riskStatus === 'SAFE'
                ? 'bg-emerald-50 text-emerald-700'
                : attendanceCalc.riskStatus === 'WARNING'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-rose-50 text-rose-700'
            }`}>
              {attendanceCalc.riskStatus}
            </span>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {attendanceCalc.presentSessions} Present / {attendanceCalc.totalSessions} Sessions
          </div>
        </div>

        {/* Next Scheduled Class */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Next Scheduled Class</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-neutral-900 mt-2 truncate">
            {nextClass?.courseCode || 'CS-301'}: {nextClass?.courseName || 'AI & Neural Networks'}
          </div>
          <div className="text-xs text-neutral-500 mt-1 font-mono">
            {nextClass?.startTime || '09:00'} - {nextClass?.endTime || '10:30'} · {nextClass?.room || 'Hall 302'}
          </div>
        </div>

        {/* Due Assessments */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Due Assessments</span>
            <FileCheck2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {pendingAssignments.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Pending response submission
          </div>
        </div>

        {/* Biometric Privacy Status */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Biometric Consent</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-neutral-900 mt-2 flex items-center gap-1.5">
            {currentUser.biometricConsent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Granted & Active</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Withheld (Manual Mode)</span>
              </>
            )}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {currentUser.biometricConsent ? 'Facial template matching enabled' : 'Non-biometric roll-call path'}
          </div>
        </div>
      </div>

      {/* Action Queue & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Action Queue */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Prioritized Action Queue</h3>
                <p className="text-xs text-neutral-500">Imminent deadlines and required actions</p>
              </div>
              <button
                onClick={() => onNavigateTab('student-assessments')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                View all tasks <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {pendingAssignments.map(asmt => (
                <div
                  key={asmt.id}
                  className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {asmt.type}
                      </span>
                      <span className="text-neutral-500 font-mono text-xs">
                        Due: {new Date(asmt.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900">{asmt.title}</h4>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">{asmt.courseName}</p>
                  </div>

                  <button
                    onClick={() => onNavigateTab('student-assessments')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shrink-0 shadow-xs"
                  >
                    Submit Response
                  </button>
                </div>
              ))}

              {pendingAssignments.length === 0 && (
                <div className="p-6 text-center text-neutral-400 text-xs">
                  All active course tasks and assignments are submitted!
                </div>
              )}
            </div>
          </div>

          {/* Quick Learning Links */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900">Enrolled Course Materials</h3>
              <button
                onClick={() => onNavigateTab('student-learning')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Access Courseware
              </button>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Recent slides, lecture videos, and discussion queries in CS-301 & CS-302
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-900 block">Lecture 04: Vector Embeddings</span>
                  <span className="text-neutral-500 text-[11px]">CS-301 · Slides Presentation (4.8 MB)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-900 block">Lab Notebook: ArcFace PyTorch</span>
                  <span className="text-neutral-500 text-[11px]">CS-301 · Code Notebook (1.2 MB)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Risk Monitor Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900">Attendance Risk Monitor</h3>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Safe &ge; 85%
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              Institutional policy requires minimum 85% attendance. Warning issued below 75%.
            </p>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-2">
              <div className="text-3xl font-extrabold font-mono text-neutral-900">
                {attendanceCalc.attendancePercentage}%
              </div>
              <div className="text-xs text-neutral-600">
                Calculated across {attendanceCalc.totalSessions} finalized class sessions
              </div>
              <div className="flex justify-center gap-4 text-xs font-mono pt-2 border-t border-neutral-200 text-neutral-600">
                <span>Present: <strong className="text-emerald-700">{attendanceCalc.presentSessions}</strong></span>
                <span>Late: <strong className="text-amber-700">{attendanceCalc.lateSessions}</strong></span>
                <span>Absent: <strong className="text-rose-600">{attendanceCalc.absentSessions}</strong></span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('student-attendance')}
              className="w-full mt-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 rounded-lg text-xs font-semibold transition-colors"
            >
              View Full Session Attendance Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
