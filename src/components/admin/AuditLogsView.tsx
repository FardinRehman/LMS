import React, { useState } from 'react';
import { db } from '../../services/db';
import { AuditEvent } from '../../types/lms';
import { ShieldCheck, Search, Filter, Download, Clock } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs] = useState<AuditEvent[]>(db.getAuditLogs());
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filtered = logs.filter(log => {
    const matchSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchAction =
      filterAction === 'ALL' ||
      log.action.startsWith(filterAction.toLowerCase());

    return matchSearch && matchAction;
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academia_audit_trail_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Append-Only Audit Trail & Compliance Records
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tamper-evident logs of authentications, role grants, attendance modifications, and ML operations (PRD Section 18 & Appendix B)
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200"
        >
          <Download className="w-3.5 h-3.5 text-neutral-600" />
          Export Audit Trail (JSON)
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by actor, action name, or details..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-500 font-medium">Domain Category:</span>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Categories</option>
            <option value="auth">Authentication & Identity (auth.*)</option>
            <option value="attendance">Attendance Operations (attendance.*)</option>
            <option value="rbac">Access Control & Roles (rbac.*)</option>
            <option value="model">AI Model & Calibration (model.*)</option>
            <option value="assessment">Assessments & Grades (assessment.*)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Audit Details & Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-500 shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-900 block">{log.actorName}</span>
                      <span className="text-neutral-400 font-mono text-[11px] block">{log.actorRole}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-700">
                      <div>{log.targetEntity}</div>
                      <span className="text-[11px] text-neutral-400">{log.targetId}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-700 max-w-md">
                      <p className="leading-snug">{log.details}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
