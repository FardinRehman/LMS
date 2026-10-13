/**
 * AcademiaOne Faculty Attendance Manager
 * Implements PRD Section 10 & 11:
 * - Timetable session selection & anchor
 * - AI photo attendance capture & pipeline execution
 * - First-class manual roll call fallback
 * - Student attendance correction request evaluation
 */

import React, { useState } from 'react';
import { db } from '../../services/db';
import {
  AttendanceSession,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  ScheduledClass,
  User,
  AttendanceStatus
} from '../../types/lms';
import { AIAttendanceReview } from './AIAttendanceReview';
import { processClassroomCapture, AIProcessingResult } from '../../services/aiAttendance';
import {
  Camera,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Check,
  X,
  Sparkles
} from 'lucide-react';

interface AttendanceManagerProps {
  currentUser: User;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'SESSIONS' | 'CORRECTIONS'>('SESSIONS');

  // Attendance state
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>(
    db.getScheduledClasses().filter(c => c.instructorId === currentUser.id || currentUser.role === 'ADMIN')
  );
  const [sessions, setSessions] = useState<AttendanceSession[]>(db.getAttendanceSessions());
  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>(
    db.getCorrectionRequests()
  );

  // Active review flow
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [aiResult, setAiResult] = useState<AIProcessingResult | null>(null);
  const [inReviewMode, setInReviewMode] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Manual roll-call mode
  const [inManualMode, setInManualMode] = useState(false);
  const [manualRecords, setManualRecords] = useState<AttendanceRecord[]>([]);

  // Correction evaluation state
  const [evaluatingCorrection, setEvaluatingCorrection] = useState<AttendanceCorrectionRequest | null>(null);
  const [evaluationDecision, setEvaluationDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [evaluationNote, setEvaluationNote] = useState('');

  const refreshData = () => {
    setScheduledClasses(
      db.getScheduledClasses().filter(c => c.instructorId === currentUser.id || currentUser.role === 'ADMIN')
    );
    setSessions(db.getAttendanceSessions());
    setCorrections(db.getCorrectionRequests());
  };

  // 1. Open or Resume Attendance Session
  const handleOpenSession = (cls: ScheduledClass) => {
    const session = db.openAttendanceSession(cls.id, currentUser.id, 'FACULTY');
    setActiveSession(session);
    refreshData();
  };

  // 2. Launch AI Photo Attendance Pipeline
  const handleLaunchAIAttendance = async (session: AttendanceSession) => {
    setActiveSession(session);
    setIsProcessingAI(true);
    setProcessingProgress(5);
    setProcessingStage('Initializing media acquisition & roster reference...');

    const roster = db.getUsers().filter(
      u => u.role === 'STUDENT' && u.sectionId === session.sectionId
    );
    const policy = db.getPolicy();

    try {
      const result = await processClassroomCapture(
        session.captureImageUrl || '/src/assets/images/classroom_lecture_session_1791895680096.jpg',
        roster,
        policy,
        (progress, stage) => {
          setProcessingProgress(progress);
          setProcessingStage(stage);
        }
      );

      // Pre-populate records with AI suggestions
      const existing = db.getAttendanceRecords(session.id);
      const updated = existing.map(rec => {
        const match = result.rosterMatching.find(m => m.studentId === rec.studentId);
        if (!match) return rec;

        return {
          ...rec,
          status: (match.statusSuggestion === 'PRESENT' ? 'PRESENT' : 'ABSENT') as AttendanceStatus,
          confidenceBand: match.confidenceBand,
          confidenceScore: match.confidenceScore,
          overrideReason: match.reasonText,
          method: 'AI_PHOTO' as const,
        };
      });

      db.updateAttendanceRecordsForSession(session.id, updated, session.captureImageUrl, 'AI_PHOTO');
      setAiResult(result);
      setIsProcessingAI(false);
      setInReviewMode(true);
      setInManualMode(false);
    } catch (e) {
      console.error(e);
      setIsProcessingAI(false);
      alert('AI Processing pipeline encountered an error. Falling back to Manual Attendance.');
      handleOpenManualMode(session);
    }
  };

  // 3. Launch 100% Manual Roll Call Mode
  const handleOpenManualMode = (session: AttendanceSession) => {
    setActiveSession(session);
    const recs = db.getAttendanceRecords(session.id);
    setManualRecords(recs);
    setInManualMode(true);
    setInReviewMode(false);
  };

  const handleManualStatusToggle = (recordId: string, status: AttendanceStatus) => {
    setManualRecords(prev =>
      prev.map(r => (r.id === recordId ? { ...r, status, updatedAt: new Date().toISOString() } : r))
    );
  };

  const handleSaveManualAttendance = () => {
    if (!activeSession) return;
    db.updateAttendanceRecordsForSession(activeSession.id, manualRecords, undefined, 'MANUAL');
    db.finalizeAttendanceSession(activeSession.id, currentUser.fullName);
    setInManualMode(false);
    setActiveSession(null);
    refreshData();
  };

  // 4. Correction Evaluation
  const handleConfirmCorrectionDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingCorrection) return;

    db.reviewCorrectionRequest(
      evaluatingCorrection.id,
      evaluationDecision,
      evaluationNote || `Decision recorded by instructor ${currentUser.fullName}`,
      currentUser.id
    );

    setEvaluatingCorrection(null);
    setEvaluationNote('');
    refreshData();
  };

  // If currently in the rich AI Review Workspace:
  if (inReviewMode && activeSession) {
    const currentRecords = db.getAttendanceRecords(activeSession.id);
    return (
      <AIAttendanceReview
        session={activeSession}
        aiResult={aiResult}
        records={currentRecords}
        onFinalized={() => {
          setInReviewMode(false);
          setActiveSession(null);
          refreshData();
        }}
        onCancel={() => {
          setInReviewMode(false);
          setActiveSession(null);
        }}
      />
    );
  }

  // If in Manual Roll Call Mode:
  if (inManualMode && activeSession) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono font-bold">
                MANUAL ROLL-CALL ATTENDANCE
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              {activeSession.courseName} · {activeSession.sectionName}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Direct roll call marking (PRD Section 10.6). AI bypassed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInManualMode(false)}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveManualAttendance}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Save & Finalize Attendance
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4 text-right">Status Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {manualRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-neutral-900">{rec.studentName}</td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{rec.rollNumber}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as AttendanceStatus[]).map(st => {
                          const isActive = rec.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleManualStatusToggle(rec.id, st)}
                              className={`px-3 py-1 text-xs font-bold uppercase font-mono rounded transition-colors ${
                                isActive
                                  ? st === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : st === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : st === 'LATE'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Attendance Sessions & Verification
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Classroom photo AI analysis, manual roll call fallback, and student dispute adjudication (PRD Section 10 & 11)
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-neutral-200 shadow-xs text-xs">
          <button
            onClick={() => setActiveSubTab('SESSIONS')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
              activeSubTab === 'SESSIONS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Class Sessions
          </button>
          <button
            onClick={() => setActiveSubTab('CORRECTIONS')}
            className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'CORRECTIONS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Correction Requests</span>
            {corrections.filter(c => c.status === 'REQUESTED').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {corrections.filter(c => c.status === 'REQUESTED').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* AI Processing Modal Progress Dialog */}
      {isProcessingAI && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Running Roster-Constrained AI Verification
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                ArcFace ResNet50 Embedding Matching Pipeline
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-xs text-neutral-600 font-mono text-left truncate">
                {processingStage}
              </p>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed text-left bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
              Biometric templates are compared only against enrolled students of this specific section. Faces with withheld consent bypass comparison automatically.
            </p>
          </div>
        </div>
      )}

      {/* Sub-tab 1: SESSIONS */}
      {activeSubTab === 'SESSIONS' && (
        <div className="space-y-6">
          {/* Active/Today Scheduled Classes to take attendance */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Active Scheduled Classes</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Select an occurrence to launch AI facial verification or conduct direct manual attendance
            </p>

            <div className="space-y-3">
              {scheduledClasses.map(cls => {
                const session = sessions.find(s => s.scheduledClassId === cls.id);
                const isFinalized = session?.state === 'SUBMITTED_FINAL';
                const isReviewReady = session?.state === 'REVIEW';

                return (
                  <div
                    key={cls.id}
                    className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {cls.dayOfWeek} · {cls.startTime} - {cls.endTime}
                        </span>
                        <span className="text-neutral-500 text-xs font-mono">{cls.room}</span>
                        {session && (
                          <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                            isFinalized
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            Session: {session.state}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-neutral-900 leading-snug">{cls.courseName}</h4>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">
                        {cls.courseCode} · {cls.sectionName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isFinalized ? (
                        <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Finalized ({session.presentCount} Present / {session.rosterSnapshotCount} Total)</span>
                        </div>
                      ) : isReviewReady && session ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveSession(session);
                              setInReviewMode(true);
                            }}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                          >
                            <UserCheck className="w-4 h-4" />
                            Review Preliminary Roster
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const s = db.openAttendanceSession(cls.id, currentUser.id, 'FACULTY');
                              handleLaunchAIAttendance(s);
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                            title="Upload classroom photo and match against enrolled student templates"
                          >
                            <Camera className="w-4 h-4" />
                            AI Photo Attendance
                          </button>
                          <button
                            onClick={() => {
                              const s = db.openAttendanceSession(cls.id, currentUser.id, 'FACULTY');
                              handleOpenManualMode(s);
                            }}
                            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold border border-neutral-200"
                            title="Direct manual roll call without AI assistance"
                          >
                            Manual Roll Call
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Past Finalized Sessions History */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Recent Finalized Attendance History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Course & Section</th>
                    <th className="pb-2.5">Capture Method</th>
                    <th className="pb-2.5">Operator</th>
                    <th className="pb-2.5 text-right">Attendance Tally</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sessions.filter(s => s.state === 'SUBMITTED_FINAL').map(sess => (
                    <tr key={sess.id} className="hover:bg-neutral-50">
                      <td className="py-2.5 font-mono text-neutral-600">{sess.date}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-neutral-900 block">{sess.courseName}</span>
                        <span className="text-neutral-400 font-mono text-[11px] block">{sess.sectionName}</span>
                      </td>
                      <td className="py-2.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          {sess.method}
                        </span>
                      </td>
                      <td className="py-2.5 text-neutral-700">
                        {sess.operatorName} ({sess.operatorRole})
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums">
                        <span className="text-emerald-700 font-bold">{sess.presentCount}P</span> /{' '}
                        <span className="text-rose-600">{sess.absentCount}A</span> /{' '}
                        <span className="text-amber-700">{sess.lateCount}L</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: CORRECTION REQUESTS */}
      {activeSubTab === 'CORRECTIONS' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Attendance Correction Queue</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review and adjudicate formal student attendance disputes (PRD Section 10.8)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                  <th className="py-3 px-3">Student & Roll No</th>
                  <th className="py-3 px-3">Class Date & Course</th>
                  <th className="py-3 px-3">Status Shift</th>
                  <th className="py-3 px-3">Student's Reason</th>
                  <th className="py-3 px-3">Resolution State</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No correction requests in the queue.
                    </td>
                  </tr>
                ) : (
                  corrections.map(req => (
                    <tr key={req.id} className="hover:bg-neutral-50">
                      <td className="py-3 px-3">
                        <span className="font-bold text-neutral-900 block">{req.studentName}</span>
                        <span className="text-neutral-500 font-mono text-[11px] block">{req.rollNumber}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-neutral-800 font-medium block">{req.courseName}</span>
                        <span className="text-neutral-500 font-mono text-[11px] block">{req.classDate}</span>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className="text-rose-600 line-through mr-1">{req.currentStatus}</span>
                        &rarr;
                        <span className="text-emerald-700 font-bold ml-1">{req.requestedStatus}</span>
                      </td>

                      <td className="py-3 px-3 max-w-xs text-neutral-700">
                        <p className="leading-snug">{req.reason}</p>
                        {req.evidenceNote && (
                          <span className="text-neutral-400 text-[11px] font-mono block mt-1">
                            Ref: {req.evidenceNote}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {req.status === 'REQUESTED' ? (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Awaiting Review
                          </span>
                        ) : req.status === 'APPROVED' ? (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Approved
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {req.status === 'REQUESTED' ? (
                          <button
                            onClick={() => {
                              setEvaluatingCorrection(req);
                              setEvaluationDecision('APPROVED');
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span className="text-neutral-400 font-mono text-[11px]">
                            {req.reviewerName}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evaluating Correction Decision Modal */}
      {evaluatingCorrection && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-neutral-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                Adjudicate Attendance Correction
              </h3>
              <button onClick={() => setEvaluatingCorrection(null)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 my-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Student:</span>
                <span className="font-bold text-neutral-900">{evaluatingCorrection.studentName} ({evaluatingCorrection.rollNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Course & Date:</span>
                <span className="font-mono text-neutral-800">{evaluatingCorrection.courseName} · {evaluatingCorrection.classDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Requested Revision:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {evaluatingCorrection.currentStatus} &rarr; {evaluatingCorrection.requestedStatus}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-200">
                <span className="text-neutral-500 block mb-0.5">Submitted Justification:</span>
                <p className="text-neutral-800 italic">"{evaluatingCorrection.reason}"</p>
                {evaluatingCorrection.evidenceNote && (
                  <span className="text-neutral-500 font-mono block mt-1">Proof: {evaluatingCorrection.evidenceNote}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleConfirmCorrectionDecision} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Official Decision</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-700">
                    <input
                      type="radio"
                      name="decision"
                      checked={evaluationDecision === 'APPROVED'}
                      onChange={() => setEvaluationDecision('APPROVED')}
                      className="text-emerald-600"
                    />
                    Approve (Create Revised Record Version)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-600">
                    <input
                      type="radio"
                      name="decision"
                      checked={evaluationDecision === 'REJECTED'}
                      onChange={() => setEvaluationDecision('REJECTED')}
                      className="text-rose-600"
                    />
                    Reject (Retain Original Record)
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Reviewer Response Notes / Audit Justification
                </label>
                <textarea
                  value={evaluationNote}
                  onChange={e => setEvaluationNote(e.target.value)}
                  placeholder="e.g., Medical documentation verified with campus clinic. Attendance status updated to Excused."
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEvaluatingCorrection(null)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Commit Official Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
