import React, { useState } from 'react';
import { db } from '../../services/db';
import { User, ScheduledClass, AttendanceSession } from '../../types/lms';
import {
  Camera,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Eye,
  ArrowRight
} from 'lucide-react';

interface CRCaptureModalProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
}

export const CRCaptureModal: React.FC<CRCaptureModalProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [scheduledClasses] = useState<ScheduledClass[]>(
    db.getScheduledClasses().filter(c => c.sectionId === currentUser.crSectionId || c.sectionId === currentUser.sectionId)
  );
  const activeClass = scheduledClasses.find(c => c.status === 'OPEN' || c.status === 'SCHEDULED') || scheduledClasses[0];

  const [selectedImage, setSelectedImage] = useState<string>(
    '/src/assets/images/classroom_lecture_session_1791895680096.jpg'
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  const handleCaptureUpload = () => {
    if (!activeClass) return;
    setSubmitting(true);

    setTimeout(() => {
      // Open attendance session with CR operator role
      const session = db.openAttendanceSession(activeClass.id, currentUser.id, 'CR');

      // Update session with uploaded capture image and move to REVIEW state
      const records = db.getAttendanceRecords(session.id);
      db.updateAttendanceRecordsForSession(session.id, records, selectedImage, 'AI_PHOTO');

      // Log audit event
      db.logAuditEvent({
        actorId: currentUser.id,
        actorName: `${currentUser.fullName} (CR)`,
        actorRole: 'CR',
        action: 'attendance.capture_uploaded',
        targetEntity: 'AttendanceSession',
        targetId: session.id,
        details: `Class Representative uploaded classroom evidence for ${session.courseName}. Queued for faculty evaluation.`,
      });

      setCreatedSessionId(session.id);
      setSubmitting(false);
      setUploadSuccess(true);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Class Representative (CR) Capture Delegation</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Classroom Attendance Capture
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Authorized delegate capture (PRD Section 10.2). You are capturing evidence on behalf of your section. Official attendance finalization remains with faculty.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-neutral-600 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
          <span>Active Window: 09:00 - 09:30 UTC</span>
        </div>
      </div>

      {uploadSuccess ? (
        <div className="bg-white rounded-xl border border-emerald-200 p-8 shadow-xs text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Classroom Capture Uploaded & Queued for Review
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Session ID: <span className="font-mono">{createdSessionId}</span>. Assigned faculty (Prof. Rajesh Sharma) has received the preliminary attendance queue for verification.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('student-dashboard')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Return to Student Home
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Class & Camera Preview (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 text-xs">
              <div>
                <span className="font-bold text-neutral-900 text-sm block">
                  {activeClass?.courseName || 'AI & Neural Networks'}
                </span>
                <span className="text-neutral-500 font-mono">
                  {activeClass?.sectionName} · Venue: {activeClass?.room}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-mono font-bold">
                {activeClass?.startTime} - {activeClass?.endTime}
              </span>
            </div>

            {/* Live Camera / Capture Viewport */}
            <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">
              <img
                src={selectedImage}
                alt="Classroom Camera Feed"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-1 rounded flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>HD WIDE-ANGLE SENSOR · 1080p</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImage('/src/assets/images/classroom_lecture_session_1791895680096.jpg')
                  }
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-medium border border-neutral-200"
                >
                  Use High-Res Hall Snapshot
                </button>
              </div>

              <button
                type="button"
                onClick={handleCaptureUpload}
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Camera className="w-4 h-4" />
                {submitting ? 'Uploading Capture & Roster...' : 'Capture & Submit for Faculty Review'}
              </button>
            </div>
          </div>

          {/* Right: Mandatory Capture Protocols (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs text-xs space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h3>Institutional Capture Guidelines</h3>
              </div>
              <p className="text-neutral-500 leading-relaxed">
                As specified in PRD Section 10.3 #37, capture operators must follow standard protocols to minimize false abstentions:
              </p>

              <ul className="space-y-2 text-neutral-700 pt-2 border-t border-neutral-100">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Panoramic Coverage:</strong> Ensure all seated rows are in the frame from an elevated vantage point.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Avoid Backlighting:</strong> Do not shoot directly into bright windows or exterior glare.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>No Staged Images:</strong> Photos must be taken live within the active class window. Staged or reused photos will trigger hash duplicate alerts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Consent Gate:</strong> Students with withheld consent are handled automatically by the system and flagged for manual roll call.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
