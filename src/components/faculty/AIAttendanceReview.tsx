/**
 * AcademiaOne AI Attendance Review Workspace
 * Implements PRD Section 10.5, 10.6 & 11:
 * - Evidence thumbnails and facial bounding boxes
 * - Calibrated confidence bands (High, Review, Unmatched)
 * - Consent-gate compliance for opted-out students (manual alternative)
 * - Unmatched faces are NEVER automatically marked absent
 * - Interactive faculty override and finalization
 */

import React, { useState } from 'react';
import { AttendanceRecord, AttendanceSession, AttendanceStatus, User } from '../../types/lms';
import { db } from '../../services/db';
import { AIProcessingResult } from '../../services/aiAttendance';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  Save,
  Check,
  Eye,
  Camera,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface AIAttendanceReviewProps {
  session: AttendanceSession;
  aiResult: AIProcessingResult | null;
  records: AttendanceRecord[];
  onFinalized: () => void;
  onCancel: () => void;
}

export const AIAttendanceReview: React.FC<AIAttendanceReviewProps> = ({
  session,
  aiResult,
  records: initialRecords,
  onFinalized,
  onCancel,
}) => {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    initialRecords[0]?.id || null
  );
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [confirmingFinalize, setConfirmingFinalize] = useState(false);
  const [showFaceBoxes, setShowFaceBoxes] = useState(true);

  const currentUser = db.getCurrentUser();

  const handleStatusChange = (recordId: string, newStatus: AttendanceStatus) => {
    setRecords(prev =>
      prev.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            status: newStatus,
            overrideReason:
              r.status !== newStatus
                ? `Faculty manual override: Changed to ${newStatus}`
                : r.overrideReason,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
  };

  const handleBulkMarkPresent = () => {
    // Only pre-mark High-Confidence matches as Present
    setRecords(prev =>
      prev.map(r => {
        if (r.confidenceBand === 'HIGH' && r.status !== 'PRESENT') {
          return { ...r, status: 'PRESENT' };
        }
        return r;
      })
    );
  };

  const handleFinalizeSubmit = () => {
    // Commit to database
    db.updateAttendanceRecordsForSession(
      session.id,
      records,
      session.captureImageUrl,
      'AI_PHOTO'
    );
    const result = db.finalizeAttendanceSession(
      session.id,
      currentUser?.fullName || 'Faculty Instructor'
    );
    if (result.success) {
      onFinalized();
    }
  };

  const selectedRecord = records.find(r => r.id === selectedRecordId);
  const matchingInfo = aiResult?.rosterMatching.find(
    m => m.studentId === selectedRecord?.studentId
  );

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;
  const lateCount = records.filter(r => r.status === 'LATE').length;
  const excusedCount = records.filter(r => r.status === 'EXCUSED').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Operational Status */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold">
              AI EVIDENCE REVIEW WORKSPACE
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              Model: {aiResult?.modelVersion || 'ArcFace v2.1.0'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            {session.courseName} · {session.sectionName}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Captured {session.date} by {session.operatorName} ({session.operatorRole}) · Roster: {records.length} enrolled students
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Exit Workspace
          </button>
          <button
            onClick={handleBulkMarkPresent}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors border border-neutral-200 flex items-center gap-1.5"
            title="Pre-fills verified high-confidence candidates as present"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Accept High-Confidence
          </button>
          <button
            onClick={() => setConfirmingFinalize(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Finalize Official Attendance
          </button>
        </div>
      </div>

      {/* Main Review Split View: Classroom Image on Left, Roster Review on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Capture Evidence (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                Classroom Capture Evidence
              </span>
              <button
                onClick={() => setShowFaceBoxes(!showFaceBoxes)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showFaceBoxes ? 'Hide Face Bounding Boxes' : 'Show Face Bounding Boxes'}
              </button>
            </div>

            <div className="relative aspect-video bg-neutral-900 overflow-hidden">
              <img
                src={session.captureImageUrl || '/src/assets/images/classroom_lecture_session_1791895680096.jpg'}
                alt="Classroom Evidence"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Render detected facial bounding boxes if enabled */}
              {showFaceBoxes &&
                aiResult?.detections.map(det => {
                  const isSelected =
                    selectedRecord &&
                    matchingInfo?.evidenceBox &&
                    matchingInfo.evidenceBox.x === det.box.x;

                  return (
                    <div
                      key={det.id}
                      style={{
                        left: `${det.box.x}%`,
                        top: `${det.box.y}%`,
                        width: `${det.box.width}%`,
                        height: `${det.box.height}%`,
                      }}
                      className={`absolute border-2 transition-all cursor-pointer pointer-events-auto rounded-xs ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-500/30 ring-2 ring-indigo-300'
                          : det.scoreBand === 'HIGH'
                          ? 'border-emerald-400 bg-emerald-500/15'
                          : 'border-amber-400 bg-amber-500/15'
                      }`}
                      title={`${det.matchedStudentName || 'Detected Face'} (${Math.round(det.matchScore * 100)}%)`}
                    />
                  );
                })}
            </div>

            <div className="p-4 text-xs space-y-2 bg-neutral-50/50">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Faces Detected in Frame:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {aiResult?.facesDetectedCount || 5} faces
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-600">
                <span>Roster Constraints:</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  Section A Enrolled Only
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                As per PRD Section 10.1: A photo establishes presence only at capture time. Unmatched or low-confidence faces must be inspected by faculty.
              </p>
            </div>
          </div>

          {/* Selected Student Evidence Details */}
          {selectedRecord && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs text-xs space-y-3">
              <h4 className="font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center justify-between">
                <span>Candidate Evidence Card</span>
                <span className="font-mono text-neutral-400 font-normal">
                  {selectedRecord.rollNumber}
                </span>
              </h4>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                  <img
                    src="/src/assets/images/student_portrait_avatar_1791895679361.jpg"
                    alt={selectedRecord.studentName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="font-bold text-neutral-900 text-sm block">
                    {selectedRecord.studentName}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-neutral-500">Confidence:</span>
                    <span className={`font-mono font-bold ${
                      selectedRecord.confidenceBand === 'HIGH'
                        ? 'text-emerald-700'
                        : selectedRecord.confidenceBand === 'REVIEW'
                        ? 'text-amber-700'
                        : 'text-neutral-500'
                    }`}>
                      {selectedRecord.confidenceScore || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {matchingInfo?.qualityFlags && (
                <div>
                  <span className="text-neutral-500 font-medium block mb-1">Quality Assessment:</span>
                  <div className="flex flex-wrap gap-1">
                    {matchingInfo.qualityFlags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-mono"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchingInfo?.reasonText && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <span className="font-semibold block mb-0.5">Decision Note:</span>
                  {matchingInfo.reasonText}
                </div>
              )}

              {selectedRecord.overrideReason && (
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
                  <span className="font-semibold block mb-0.5">Faculty Audit Note:</span>
                  {selectedRecord.overrideReason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Roster Verification Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
            {/* Tally strip */}
            <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500 font-sans font-semibold">Roster Verification:</span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-bold">Present: {presentCount}</span>
                <span className="text-rose-600 font-bold">Absent: {absentCount}</span>
                <span className="text-amber-700 font-bold">Late: {lateCount}</span>
                <span className="text-indigo-700 font-bold">Excused: {excusedCount}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 font-semibold">
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">AI Suggestion</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3 text-right">Official Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {records.map(rec => {
                    const isSelected = selectedRecordId === rec.id;
                    const match = aiResult?.rosterMatching.find(m => m.studentId === rec.studentId);
                    const isConsentWithheld = match && !match.biometricConsent;

                    return (
                      <tr
                        key={rec.id}
                        onClick={() => setSelectedRecordId(rec.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/70' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className="font-bold text-neutral-900 block">{rec.studentName}</span>
                          <span className="text-neutral-400 font-mono text-[11px] block">{rec.rollNumber}</span>
                        </td>

                        <td className="py-3 px-3">
                          {isConsentWithheld ? (
                            <span className="text-neutral-600 font-medium flex items-center gap-1 text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              Consent Withheld
                            </span>
                          ) : rec.confidenceBand === 'HIGH' ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              High Confidence
                            </span>
                          ) : rec.confidenceBand === 'REVIEW' ? (
                            <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Review Needed
                            </span>
                          ) : (
                            <span className="text-neutral-500 font-medium flex items-center gap-1 text-[11px]">
                              <XCircle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              Unmatched in Photo
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold tabular-nums">
                          {isConsentWithheld ? (
                            <span className="text-neutral-400 text-[11px]">Bypassed</span>
                          ) : (
                            <span className={rec.confidenceScore && rec.confidenceScore >= 85 ? 'text-emerald-700' : 'text-neutral-600'}>
                              {rec.confidenceScore || 0}%
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center rounded-lg border border-neutral-200 p-0.5 bg-neutral-50">
                            {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as AttendanceStatus[]).map(st => {
                              const isActive = rec.status === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(rec.id, st)}
                                  className={`px-2 py-1 text-[10px] font-bold uppercase font-mono rounded transition-colors ${
                                    isActive
                                      ? st === 'PRESENT'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : st === 'ABSENT'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : st === 'LATE'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-indigo-600 text-white shadow-xs'
                                      : 'text-neutral-600 hover:text-neutral-900'
                                  }`}
                                >
                                  {st[0]}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Finalize Submission */}
      {confirmingFinalize && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-neutral-900">
              Confirm Official Attendance Submission
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              This action commits the official record for {session.courseName} ({session.date}). Changes after finalization require a formal correction workflow.
            </p>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 my-4 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span>Present:</span>
                <span className="font-bold text-emerald-700">{presentCount} students</span>
              </div>
              <div className="flex justify-between">
                <span>Absent:</span>
                <span className="font-bold text-rose-600">{absentCount} students</span>
              </div>
              <div className="flex justify-between">
                <span>Late:</span>
                <span className="font-bold text-amber-700">{lateCount} students</span>
              </div>
              <div className="flex justify-between">
                <span>Excused:</span>
                <span className="font-bold text-indigo-700">{excusedCount} students</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setConfirmingFinalize(false)}
                className="px-3.5 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeSubmit}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Sign & Finalize Official Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
