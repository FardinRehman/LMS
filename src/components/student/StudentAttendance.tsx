import React, { useState } from 'react';
import { db } from '../../services/db';
import { AttendanceRecord, AttendanceCorrectionRequest, User } from '../../types/lms';
import { CorrectionModal } from '../common/CorrectionModal';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  Send,
  HelpCircle
} from 'lucide-react';

interface StudentAttendanceProps {
  currentUser: User;
}

export const StudentAttendance: React.FC<StudentAttendanceProps> = ({ currentUser }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>(
    db.getAttendanceRecords().filter(r => r.studentId === currentUser.id)
  );
  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>(
    db.getCorrectionRequests().filter(c => c.studentId === currentUser.id)
  );
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceRecord | null>(null);

  const attendanceCalc = db.calculateStudentAttendance(currentUser.id);
  const sessions = db.getAttendanceSessions();

  const refreshData = () => {
    setRecords(db.getAttendanceRecords().filter(r => r.studentId === currentUser.id));
    setCorrections(db.getCorrectionRequests().filter(c => c.studentId === currentUser.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            My Attendance Record & Verification History
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Transparent session logs, facial recognition evidence status, and correction submission (PRD Section 8 & 10.8)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-lg font-mono font-bold ${
            attendanceCalc.riskStatus === 'SAFE'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : attendanceCalc.riskStatus === 'WARNING'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            RISK STATUS: {attendanceCalc.riskStatus} ({attendanceCalc.attendancePercentage}%)
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium block">Total Finalized Classes</span>
          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
            {attendanceCalc.totalSessions}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium block">Classes Attended</span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
            {attendanceCalc.presentSessions}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium block">Late / Excused</span>
          <span className="text-xl font-bold font-mono text-amber-700 mt-1 block">
            {attendanceCalc.lateSessions + attendanceCalc.excusedSessions}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium block">Absences Recorded</span>
          <span className="text-xl font-bold font-mono text-rose-600 mt-1 block">
            {attendanceCalc.absentSessions}
          </span>
        </div>
      </div>

      {/* Attendance Session History Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">Official Class Attendance Ledger</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Immutable session records signed by assigned faculty instructors
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Course & Subject</th>
                <th className="py-2.5 px-3">Verification Method</th>
                <th className="py-2.5 px-3">Official Status</th>
                <th className="py-2.5 px-3">Authorized By</th>
                <th className="py-2.5 px-3 text-right">Dispute / Correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    No finalized attendance records found yet.
                  </td>
                </tr>
              ) : (
                records.map(rec => {
                  const sess = sessions.find(s => s.id === rec.sessionId);
                  const hasPendingCorrection = corrections.some(
                    c => c.attendanceRecordId === rec.id && c.status === 'REQUESTED'
                  );

                  return (
                    <tr key={rec.id} className="hover:bg-neutral-50">
                      <td className="py-3 px-3 font-mono text-neutral-600">
                        {sess?.date || '2026-10-13'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-neutral-900 block">
                          {sess?.courseName || 'Artificial Intelligence & Neural Networks'}
                        </span>
                        <span className="text-neutral-500 font-mono text-[11px] block">
                          {sess?.sectionName || 'Section A'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {rec.method === 'AI_PHOTO' ? (
                          <span className="text-indigo-700 font-medium flex items-center gap-1 font-mono text-[11px]">
                            <Camera className="w-3.5 h-3.5 text-indigo-600" />
                            AI Facial Verification ({rec.confidenceScore || 95}%)
                          </span>
                        ) : (
                          <span className="text-neutral-600 font-medium flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            Manual In-Person Call
                          </span>
                        )}
                        {rec.overrideReason && (
                          <span className="text-neutral-400 text-[10px] block mt-0.5 italic">
                            {rec.overrideReason}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold">
                        {rec.status === 'PRESENT' ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            PRESENT
                          </span>
                        ) : rec.status === 'ABSENT' ? (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            ABSENT
                          </span>
                        ) : rec.status === 'LATE' ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            LATE
                          </span>
                        ) : (
                          <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            EXCUSED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-neutral-600">
                        {rec.finalizedBy}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {hasPendingCorrection ? (
                          <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Correction In Review
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedRecordForCorrection(rec)}
                            className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold border border-indigo-200 hover:bg-indigo-50 rounded transition-colors"
                          >
                            Request Correction
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submitted Correction Requests Status */}
      {corrections.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-neutral-900">My Correction Requests & Status</h3>
          <div className="space-y-3 text-xs">
            {corrections.map(c => (
              <div key={c.id} className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-neutral-900">
                    {c.courseName} ({c.classDate})
                  </span>
                  <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                    c.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : c.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-neutral-600 font-mono text-[11px]">
                  Requested: {c.currentStatus} &rarr; {c.requestedStatus} · Reason: "{c.reason}"
                </div>
                {c.reviewerResponse && (
                  <div className="mt-1.5 p-2 bg-white rounded border border-neutral-200 text-neutral-700">
                    <span className="font-semibold text-neutral-900">Faculty Response:</span> {c.reviewerResponse} (by {c.reviewerName})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {selectedRecordForCorrection && (
        <CorrectionModal
          record={selectedRecordForCorrection}
          studentId={currentUser.id}
          isOpen={!!selectedRecordForCorrection}
          onClose={() => setSelectedRecordForCorrection(null)}
          onSubmitted={refreshData}
        />
      )}
    </div>
  );
};
