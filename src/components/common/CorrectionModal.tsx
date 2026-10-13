import React, { useState } from 'react';
import { db } from '../../services/db';
import { AttendanceRecord, AttendanceStatus } from '../../types/lms';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';

interface CorrectionModalProps {
  record: AttendanceRecord;
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  record,
  studentId,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>('PRESENT');
  const [reason, setReason] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific justification for this correction request.');
      return;
    }

    const res = db.requestAttendanceCorrection({
      recordId: record.id,
      studentId,
      requestedStatus: requestedStatus as 'PRESENT' | 'EXCUSED' | 'LATE',
      reason,
      evidenceNote,
    });

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1000);
    } else {
      setError(res.error || 'Failed to submit correction request.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full border border-neutral-200 shadow-xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Request Attendance Correction
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Official revision workflow (PRD Section 10.8)
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-neutral-900">Correction Request Submitted</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
              Your request has been routed to the course instructor. You will be notified upon evaluation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500 block">Student:</span>
                <span className="font-semibold text-neutral-800">{record.studentName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Current Status:</span>
                <span className="font-semibold text-rose-600 font-mono">{record.status}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Requested Corrected Status
              </label>
              <select
                value={requestedStatus}
                onChange={e => setRequestedStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-600"
              >
                <option value="PRESENT">Present (In classroom at session time)</option>
                <option value="EXCUSED">Excused (Institutional/Medical Leave)</option>
                <option value="LATE">Late (Arrived with authorized permit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Reason / Justification
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why this record should be revised (e.g. seated in back row outside camera angle, or lab duty permit)..."
                rows={3}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Evidence Reference or Document ID (Optional)
              </label>
              <input
                type="text"
                value={evidenceNote}
                onChange={e => setEvidenceNote(e.target.value)}
                placeholder="e.g., Campus Health Slip #HC-2024 or Academic Leave Form"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
