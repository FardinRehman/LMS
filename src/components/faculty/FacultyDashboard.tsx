import React from 'react';
import { db } from '../../services/db';
import { User } from '../../types/lms';
import {
  Camera,
  FileCheck2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface FacultyDashboardProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const scheduledClasses = db.getScheduledClasses().filter(
    c => c.instructorId === currentUser.id
  );
  const sessions = db.getAttendanceSessions().filter(
    s => s.instructorId === currentUser.id
  );
  const pendingReviewSessions = sessions.filter(
    s => s.state === 'OPEN' || s.state === 'REVIEW'
  );
  const corrections = db.getCorrectionRequests().filter(
    r => r.status === 'REQUESTED'
  );
  const assessments = db.getAssessments();
  const doubts = db.getDoubts();
  const unresolvedDoubts = doubts.filter(d => d.status === 'UNRESOLVED');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <span>Faculty Instructional Workspace</span>
            <span className="text-neutral-300">·</span>
            <span>{currentUser.designation || 'Faculty Member'}</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Welcome back, {currentUser.fullName}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Manage course curriculum, conduct AI-assisted and manual attendance verification, grade student assessments, and review academic dispute requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('faculty-attendance')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Camera className="w-4 h-4" />
            Open Attendance Workspace
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Pending Attendance Review</span>
            <Camera className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {pendingReviewSessions.length}
          </div>
          <div className="text-xs text-indigo-600 mt-1 font-medium">
            Sessions awaiting final human sign-off
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Correction Requests</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {corrections.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Student attendance disputes to review
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Assessments Active</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {assessments.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Assignments and online quizzes published
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Unresolved Doubts</span>
            <HelpCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {unresolvedDoubts.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Questions awaiting instructor response
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Classes & Attendance Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Scheduled Teaching Sessions */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Assigned Scheduled Classes</h3>
                <p className="text-xs text-neutral-500">Curriculum timetable occurrences</p>
              </div>
              <button
                onClick={() => onNavigateTab('faculty-timetable')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View full schedule
              </button>
            </div>

            <div className="space-y-3">
              {scheduledClasses.map(cls => (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {cls.dayOfWeek} · {cls.startTime} - {cls.endTime}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {cls.room}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900">{cls.courseName}</h4>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">{cls.courseCode} · {cls.sectionName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateTab('faculty-attendance')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Take Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Attendance Sessions Awaiting Faculty Finalization */}
          {pendingReviewSessions.length > 0 && (
            <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900">Pending Review Queue</h3>
              </div>
              <p className="text-xs text-amber-700 mb-4 leading-relaxed">
                As required by PRD Section 10.1 & 10.5, AI outputs are suggestions only. Faculty review and confirmation is mandatory before official record finalization.
              </p>

              <div className="space-y-2">
                {pendingReviewSessions.map(sess => (
                  <div
                    key={sess.id}
                    className="p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-neutral-900">{sess.courseName}</span>
                      <span className="text-neutral-500 font-mono block mt-0.5">
                        {sess.sectionName} · Date: {sess.date} · Captured by: {sess.operatorName}
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('faculty-attendance')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center gap-1"
                    >
                      Review Roster
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Attendance Corrections to Review */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-neutral-700" />
                <h3 className="text-sm font-bold text-neutral-900">Attendance Disputes</h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {corrections.length} pending
              </span>
            </div>

            {corrections.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">
                No active student correction requests.
              </p>
            ) : (
              <div className="space-y-3">
                {corrections.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-900">{c.studentName}</span>
                      <span className="text-[11px] font-mono text-rose-600">
                        {c.currentStatus} &rarr; {c.requestedStatus}
                      </span>
                    </div>
                    <p className="text-neutral-600 italic line-clamp-2">"{c.reason}"</p>
                    {c.evidenceNote && (
                      <span className="text-[11px] text-neutral-500 font-mono block mt-1">
                        Ref: {c.evidenceNote}
                      </span>
                    )}
                    <button
                      onClick={() => onNavigateTab('faculty-attendance')}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 block"
                    >
                      Evaluate Request &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
