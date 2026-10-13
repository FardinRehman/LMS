import React, { useState } from 'react';
import { db } from '../../services/db';
import { AIModelRelease } from '../../types/lms';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Users,
  FileCheck,
  Lock
} from 'lucide-react';

export const ModelOperations: React.FC = () => {
  const [model, setModel] = useState<AIModelRelease>(db.getModelRelease());
  const [highCutoff, setHighCutoff] = useState(model.highConfidenceCutoff * 100);
  const [reviewCutoff, setReviewCutoff] = useState(model.reviewBandCutoff * 100);
  const [calibrated, setCalibrated] = useState(false);

  const users = db.getUsers().filter(u => u.role === 'STUDENT');
  const consentedCount = users.filter(u => u.biometricConsent).length;
  const withheldCount = users.filter(u => !u.biometricConsent).length;

  const handleSaveCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateModelThresholds(highCutoff / 100, reviewCutoff / 100);
    setModel(db.getModelRelease());
    setCalibrated(true);
    setTimeout(() => setCalibrated(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            AI Model Governance & MLOps Console
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Model cards, performance bounds, calibrated decision bands, and biometric consent registry (PRD Section 11 & 18)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-semibold border border-emerald-200">
            RELEASE GATE APPROVED: {model.version}
          </span>
        </div>
      </div>

      {/* Model Spec Card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">{model.name}</h3>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Version {model.version} · Approved by {model.approvedBy}
              </p>
            </div>
          </div>
          <span className="text-xs text-neutral-400 font-mono">Released: {model.releaseDate}</span>
        </div>

        <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600 space-y-1">
          <div><strong className="text-neutral-800">Pipeline Architecture:</strong> {model.architecture}</div>
          <div><strong className="text-neutral-800">Constraint Policy:</strong> Roster-constrained strictly to enrolled students of the active scheduled section.</div>
          <div><strong className="text-neutral-800">Privacy Safeguard:</strong> Zero raw embedding export to client. Human-in-the-loop review mandatory before attendance finalization.</div>
        </div>

        {/* Locked Test Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-100">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 block">Locked Test Accuracy</span>
            <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">{model.accuracyRate}%</span>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">&plusmn; 0.4% 95% CI</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 block">False Match Rate (FMR)</span>
            <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
              {(model.falseMatchRate * 100).toFixed(2)}%
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Zero cross-student mixups</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 block">False Non-Match (FNMR)</span>
            <span className="text-xl font-bold font-mono text-amber-600 mt-1 block">
              {(model.falseNonMatchRate * 100).toFixed(2)}%
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Sent to human review</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 block">Decision Bands</span>
            <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">3 Bands</span>
            <span className="text-[11px] text-indigo-600 mt-0.5 block">High / Review / Unmatched</span>
          </div>
        </div>
      </div>

      {/* Threshold Calibration Form */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-neutral-900">Decision Threshold Calibration</h3>
          </div>
          {calibrated && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              Thresholds Recalibrated
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
          As mandated by PRD Section 11.7: Do not hard-code cosine similarity. Calibrate operating bands to prevent incorrect auto-acceptance while minimizing human fatigue.
        </p>

        <form onSubmit={handleSaveCalibration} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-neutral-800">
                  High-Confidence Band Cutoff: <span className="font-mono text-indigo-600">{highCutoff}%</span>
                </label>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                value={highCutoff}
                onChange={e => setHighCutoff(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[11px] text-neutral-500 mt-2 block leading-relaxed">
                Matches &ge; {highCutoff}% are proposed as verified present with high confidence. Faculty confirmation remains mandatory.
              </span>
            </div>

            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-neutral-800">
                  Review Band Cutoff: <span className="font-mono text-amber-600">{reviewCutoff}%</span>
                </label>
              </div>
              <input
                type="range"
                min="50"
                max="80"
                value={reviewCutoff}
                onChange={e => setReviewCutoff(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-neutral-500 mt-2 block leading-relaxed">
                Scores between {reviewCutoff}% and {highCutoff}% are marked as Review Candidates with explicit quality flags for human check.
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
            >
              Update Calibrated Bands
            </button>
          </div>
        </form>
      </div>

      {/* Biometric Consent Registry (PRD Section 11.3 & 18) */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold text-neutral-900">Biometric Consent & Template Registry</h3>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {consentedCount} Consented · {withheldCount} Withheld
          </span>
        </div>

        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
          In strict compliance with privacy regulations (PRD Section 18), any student who opts out of biometric processing must never have their face compared or stored in embedding tables. They are served via an accessible non-biometric manual alternative path.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="pb-2.5">Student Name</th>
                <th className="pb-2.5">Roll Number</th>
                <th className="pb-2.5">Biometric Status</th>
                <th className="pb-2.5">Attendance Pipeline Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map(st => (
                <tr key={st.id} className="hover:bg-neutral-50">
                  <td className="py-2.5 font-medium text-neutral-900">{st.fullName}</td>
                  <td className="py-2.5 font-mono text-neutral-600">{st.rollNumber}</td>
                  <td className="py-2.5">
                    {st.biometricConsent ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Active Consent Signed
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Consent Withheld / Opted Out
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-neutral-600">
                    {st.biometricConsent
                      ? 'ArcFace 512-d Template Match'
                      : 'Manual Roll Call / Desk Alternative Only'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
