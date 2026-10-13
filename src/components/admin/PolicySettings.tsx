import React, { useState } from 'react';
import { db } from '../../services/db';
import { AttendancePolicy } from '../../types/lms';
import { Sliders, Save, CheckCircle, Shield, AlertTriangle } from 'lucide-react';

export const PolicySettings: React.FC = () => {
  const [policy, setPolicy] = useState<AttendancePolicy>(db.getPolicy());
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updatePolicy(policy);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Institutional Attendance & Academic Policy
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configurable calculation formulas, threshold baselines, and AI attendance parameters (PRD Section 10.7 & 24)
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Policy updated & audit logged</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Attendance Calculation & Risk Thresholds */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-neutral-900">Attendance Formula & Risk Gates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Institutional Minimum Attendance Threshold (%)
              </label>
              <input
                type="number"
                value={policy.minimumAttendancePercent}
                onChange={e => setPolicy({ ...policy, minimumAttendancePercent: Number(e.target.value) })}
                min={50}
                max={100}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Students below this threshold are flagged for exam withholding review.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Warning Notification Threshold (%)
              </label>
              <input
                type="number"
                value={policy.warningThresholdPercent}
                onChange={e => setPolicy({ ...policy, warningThresholdPercent: Number(e.target.value) })}
                min={40}
                max={95}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Triggers proactive early warning alerts to student and academic advisor.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Late Status Credit Fraction (0.0 to 1.0)
              </label>
              <input
                type="number"
                step="0.1"
                value={policy.lateCreditFraction}
                onChange={e => setPolicy({ ...policy, lateCreditFraction: Number(e.target.value) })}
                min={0}
                max={1}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Fractional attendance credited when student arrives late with permit.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Excused Status Credit Fraction (0.0 to 1.0)
              </label>
              <input
                type="number"
                step="0.1"
                value={policy.excusedCreditFraction}
                onChange={e => setPolicy({ ...policy, excusedCreditFraction: Number(e.target.value) })}
                min={0}
                max={1}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Treatment of official medical/institutional leave in attendance denominator.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Attendance Correction Request Window (Hours)
              </label>
              <input
                type="number"
                value={policy.correctionWindowHours}
                onChange={e => setPolicy({ ...policy, correctionWindowHours: Number(e.target.value) })}
                min={12}
                max={168}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Maximum elapsed hours post-session for student correction submission.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Classroom Capture Window (Minutes)
              </label>
              <input
                type="number"
                value={policy.captureWindowMinutes}
                onChange={e => setPolicy({ ...policy, captureWindowMinutes: Number(e.target.value) })}
                min={5}
                max={60}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Permitted time window around class start time to upload attendance photo.
              </span>
            </div>
          </div>
        </div>

        {/* AI Attendance Feature Flags & Governance */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900">AI Attendance Feature Gates & Pilot Controls</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <span className="font-semibold text-neutral-900 block">
                  Enable AI-Assisted Photo Attendance Pipeline
                </span>
                <span className="text-neutral-500 mt-0.5 block leading-relaxed">
                  Activates face detection and roster-constrained embedding matching. Note: Manual attendance fallback remains operational at all times.
                </span>
              </div>
              <input
                type="checkbox"
                checked={policy.aiAttendanceEnabled}
                onChange={e => setPolicy({ ...policy, aiAttendanceEnabled: e.target.checked })}
                className="mt-1 rounded text-indigo-600 focus:ring-0 w-4 h-4"
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <span className="font-semibold text-neutral-900 block">
                  Video Frame Sampling Mode (Pilot Feature Flag)
                </span>
                <span className="text-neutral-500 mt-0.5 block leading-relaxed">
                  Enables temporal frame sampling for short classroom camera pans (PRD Section 10.4). Disabled by default for standard deployments.
                </span>
              </div>
              <input
                type="checkbox"
                checked={policy.videoSamplingEnabled}
                onChange={e => setPolicy({ ...policy, videoSamplingEnabled: e.target.checked })}
                className="mt-1 rounded text-indigo-600 focus:ring-0 w-4 h-4"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            Commit Policy Changes
          </button>
        </div>
      </form>
    </div>
  );
};
