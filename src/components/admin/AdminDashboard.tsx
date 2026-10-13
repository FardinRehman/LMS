import React from 'react';
import { db } from '../../services/db';
import {
  Users,
  Building,
  Calendar,
  AlertTriangle,
  Cpu,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const users = db.getUsers();
  const departments = db.getDepartments();
  const scheduledClasses = db.getScheduledClasses();
  const attendanceSessions = db.getAttendanceSessions();
  const auditLogs = db.getAuditLogs().slice(0, 6);
  const modelRelease = db.getModelRelease();

  const totalStudents = users.filter(u => u.role === 'STUDENT' && u.accountStatus === 'ACTIVE').length;
  const totalFaculty = users.filter(u => u.role === 'FACULTY' && u.accountStatus === 'ACTIVE').length;
  const todayClasses = scheduledClasses.filter(c => c.status !== 'CANCELLED');

  // Calculate students with critical attendance risk (<75%)
  const students = users.filter(u => u.role === 'STUDENT');
  const criticalRiskStudents = students.filter(s => {
    const calc = db.calculateStudentAttendance(s.id);
    return calc.totalSessions > 0 && calc.riskStatus === 'CRITICAL';
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Campus Overview */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 lg:p-8 col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">
                <span>Academic Operations Console</span>
                <span className="text-neutral-300">·</span>
                <span>Autumn Semester 2026</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Institutional Administration & Governance
              </h1>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed max-w-2xl">
                Unified governance of academic curriculum, user role provisioning, automated scheduling conflict resolution, and AI-assisted attendance verification pipelines.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-6 pt-6 border-t border-neutral-100">
              <button
                onClick={() => onNavigateTab('admin-users')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Users className="w-4 h-4" />
                Manage Users & Roles
              </button>
              <button
                onClick={() => onNavigateTab('admin-timetable')}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200"
              >
                <Calendar className="w-4 h-4 text-neutral-600" />
                Timetable & Classes
              </button>
              <button
                onClick={() => onNavigateTab('admin-model-ops')}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200"
              >
                <Cpu className="w-4 h-4 text-neutral-600" />
                AI Model Governance
              </button>
            </div>
          </div>

          <div className="relative min-h-[160px] lg:min-h-full bg-neutral-100 border-t lg:border-t-0 lg:border-l border-neutral-200">
            <img
              src="/src/assets/images/lms_campus_hero_1791895679386.jpg"
              alt="Campus Architecture"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs text-white font-medium">Main Academic Quadrant · Engineering Campus</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {totalStudents}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Active in 2 Departments · 4 Programs
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Active Faculty</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {totalFaculty}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Teaching 3 published courses
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Today's Classes</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {todayClasses.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {attendanceSessions.filter(s => s.state === 'SUBMITTED_FINAL').length} finalized sessions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Attendance At-Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2 font-mono tabular-nums">
            {criticalRiskStudents.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Flagged below institutional 75% baseline
          </div>
        </div>
      </div>

      {/* Main Grid: Departments + Model Health + Security Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Academic Departments & Model Release */}
        <div className="lg:col-span-2 space-y-6">
          {/* Departments Table */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Academic Departments</h3>
                <p className="text-xs text-neutral-500">Curriculum structure and leadership</p>
              </div>
              <button
                onClick={() => onNavigateTab('admin-academic')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                    <th className="pb-2.5">Code</th>
                    <th className="pb-2.5">Department Name</th>
                    <th className="pb-2.5">Head of Dept</th>
                    <th className="pb-2.5 text-right">Students</th>
                    <th className="pb-2.5 text-right">Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {departments.map(d => (
                    <tr key={d.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-indigo-700">{d.code}</td>
                      <td className="py-2.5 font-medium text-neutral-900">{d.name}</td>
                      <td className="py-2.5 text-neutral-600">{d.headOfDepartment}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-neutral-700">{d.totalStudents}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-neutral-700">{d.totalFaculty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Recognition Engine Status (PRD Section 11) */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-neutral-900">AI Attendance Recognizer</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-semibold border border-emerald-200">
                ACTIVE · {modelRelease.version}
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              {modelRelease.name} ({modelRelease.architecture}). Validated on subject-disjoint test sets. Operates with mandatory faculty confirmation before official record finalization.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs">
              <div>
                <span className="text-neutral-500 block">Test Accuracy</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">{modelRelease.accuracyRate}%</span>
              </div>
              <div>
                <span className="text-neutral-500 block">False Match (FMR)</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">{(modelRelease.falseMatchRate * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-neutral-500 block">High Conf. Cutoff</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">&ge; {(modelRelease.highConfidenceCutoff * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Review Band</span>
                <span className="font-mono font-bold text-amber-600 text-sm">&ge; {(modelRelease.reviewBandCutoff * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Append-Only Audit Logs */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-neutral-700" />
                <h3 className="text-sm font-bold text-neutral-900">Security & Audit Trail</h3>
              </div>
              <button
                onClick={() => onNavigateTab('admin-audit')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View all
              </button>
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Append-only audit trail of sensitive role and attendance events
            </p>

            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="text-xs p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-semibold text-indigo-700 truncate">{log.action}</span>
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-neutral-700 leading-snug line-clamp-2">{log.details}</p>
                  <div className="mt-1 text-neutral-400 text-[11px] flex items-center gap-1">
                    <span>By {log.actorName}</span>
                    <span>·</span>
                    <span className="font-mono">{log.actorRole}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
