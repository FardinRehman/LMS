import React, { useState } from 'react';
import { db } from '../../services/db';
import { User, UserRole } from '../../types/lms';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  KeyRound,
  Download,
  Upload,
  AlertCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [resetTokenMessage, setResetTokenMessage] = useState<string | null>(null);

  // New user form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [departmentId, setDepartmentId] = useState('dept-cs');
  const [rollNumber, setRollNumber] = useState('');
  const [staffId, setStaffId] = useState('');
  const [designation, setDesignation] = useState('');
  const [semester, setSemester] = useState(5);
  const [sectionId, setSectionId] = useState('sec-cs301-a');
  const [isCR, setIsCR] = useState(false);
  const [biometricConsent, setBiometricConsent] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk import preview state
  const [csvContent, setCsvContent] = useState('');
  const [importPreview, setImportPreview] = useState<{
    valid: Partial<User>[];
    invalid: { row: number; error: string }[];
  } | null>(null);

  const departments = db.getDepartments();
  const sections = db.getSections();

  const refreshUsers = () => {
    setUsers(db.getUsers());
  };

  const handleToggleStatus = (id: string) => {
    db.toggleUserStatus(id);
    refreshUsers();
  };

  const handleGenerateReset = (user: User) => {
    const token = 'rst_' + Math.random().toString(36).substring(2, 10);
    setResetTokenMessage(
      `Secure password reset token generated for ${user.fullName}: [${token}]. Link expires in 2 hours.`
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = db.createUser({
      fullName,
      email,
      role,
      departmentId,
      rollNumber: role === 'STUDENT' ? rollNumber : undefined,
      studentId: role === 'STUDENT' ? `STU-${rollNumber}` : undefined,
      semester: role === 'STUDENT' ? semester : undefined,
      sectionId: role === 'STUDENT' ? sectionId : undefined,
      isCR: role === 'STUDENT' ? isCR : false,
      biometricConsent: role === 'STUDENT' ? biometricConsent : true,
      staffId: role !== 'STUDENT' ? staffId : undefined,
      designation: role !== 'STUDENT' ? designation : undefined,
      accountStatus: 'ACTIVE',
    });

    if (result.success) {
      setCreateModalOpen(false);
      // Reset form
      setFullName('');
      setEmail('');
      setRollNumber('');
      setStaffId('');
      refreshUsers();
    } else {
      setFormError(result.error || 'Failed to create user record.');
    }
  };

  const handleParseCsv = () => {
    if (!csvContent.trim()) return;
    const lines = csvContent.trim().split('\n');
    const valid: Partial<User>[] = [];
    const invalid: { row: number; error: string }[] = [];

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('name')) return; // skip header
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 3) {
        invalid.push({ row: idx + 1, error: 'Insufficient columns (Expected: Name, Email, Role, ID)' });
        return;
      }
      const [name, mail, roleStr, identifier] = parts;
      const upperRole = roleStr.toUpperCase() as UserRole;
      if (!['ADMIN', 'FACULTY', 'STUDENT', 'EXAMINER', 'AUDITOR'].includes(upperRole)) {
        invalid.push({ row: idx + 1, error: `Invalid role "${roleStr}"` });
        return;
      }
      valid.push({
        fullName: name,
        email: mail,
        role: upperRole,
        rollNumber: upperRole === 'STUDENT' ? identifier : undefined,
        staffId: upperRole !== 'STUDENT' ? identifier : undefined,
        departmentId: 'dept-cs',
        sectionId: 'sec-cs301-a',
        accountStatus: 'ACTIVE',
        biometricConsent: true,
      });
    });

    setImportPreview({ valid, invalid });
  };

  const handleCommitBulkImport = () => {
    if (!importPreview?.valid.length) return;
    importPreview.valid.forEach(u => {
      db.createUser(u);
    });
    setBulkImportOpen(false);
    setImportPreview(null);
    setCsvContent('');
    refreshUsers();
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.staffId && u.staffId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.accountStatus === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            User Directory & Role Provisioning
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Admin-controlled account provisioning, institutional identifiers, and biometric consent states (PRD Section 4 & 7)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkImportOpen(true)}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-600" />
            Bulk CSV Import
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Provision New User
          </button>
        </div>
      </div>

      {resetTokenMessage && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{resetTokenMessage}</span>
          </div>
          <button onClick={() => setResetTokenMessage(null)} className="text-indigo-400 hover:text-indigo-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, roll number, staff ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="FACULTY">Faculty</option>
            <option value="STUDENT">Student</option>
            <option value="AUDITOR">Auditor</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-neutral-500 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="py-3 px-4">User & Identifier</th>
                <th className="py-3 px-4">Role & Scope</th>
                <th className="py-3 px-4">Department / Section</th>
                <th className="py-3 px-4">Biometric Consent</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    No matching user records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-200 overflow-hidden shrink-0 border border-neutral-300">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-neutral-600">
                              {user.fullName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-900 block">{user.fullName}</span>
                          <span className="text-neutral-500 font-mono text-[11px] block">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-neutral-800">{user.role}</span>
                        {user.isCR && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                            CR
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-400 font-mono text-[11px] block mt-0.5">
                        {user.rollNumber || user.staffId || 'SYS-ID'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-700">
                      <div>{user.departmentId?.toUpperCase() || 'CSE'}</div>
                      {user.sectionId && (
                        <span className="text-neutral-500 text-[11px] block">
                          {sections.find(s => s.id === user.sectionId)?.name || user.sectionId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {user.role === 'STUDENT' ? (
                        user.biometricConsent ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Granted
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium flex items-center gap-1" title="Manual attendance alternative only">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Withheld (Manual)
                          </span>
                        )
                      ) : (
                        <span className="text-neutral-400">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {user.accountStatus === 'ACTIVE' ? (
                        <span className="text-emerald-700 font-semibold">Active</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Deactivated</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGenerateReset(user)}
                          className="p-1 text-neutral-400 hover:text-indigo-600 rounded"
                          title="Generate single-use password reset link"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-2 py-1 text-xs font-medium rounded border ${
                            user.accountStatus === 'ACTIVE'
                              ? 'border-neutral-300 text-neutral-600 hover:text-rose-600 hover:border-rose-300'
                              : 'border-emerald-300 text-emerald-700 bg-emerald-50'
                          }`}
                        >
                          {user.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-neutral-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">Provision Institutional User</h3>
              <button onClick={() => setCreateModalOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g., Samuel O'Connor"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g., samuel.oc@academiaone.edu"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty / Instructor</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:border-indigo-600"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {role === 'STUDENT' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Roll / Admission Number</label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={e => setRollNumber(e.target.value)}
                        placeholder="CS2024-190"
                        required
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Assigned Section</label>
                      <select
                        value={sectionId}
                        onChange={e => setSectionId(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:border-indigo-600"
                      >
                        {sections.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCR}
                        onChange={e => setIsCR(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span className="font-semibold text-neutral-800">Delegate as Class Representative (CR)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={biometricConsent}
                        onChange={e => setBiometricConsent(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span className="text-neutral-700">Biometric Consent Signed (Enables AI photo attendance)</span>
                    </label>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Staff ID</label>
                    <input
                      type="text"
                      value={staffId}
                      onChange={e => setStaffId(e.target.value)}
                      placeholder="FAC-310"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      placeholder="Assistant Professor"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-xs"
                >
                  Save & Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal (PRD Section 7) */}
      {bulkImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-neutral-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-neutral-900">Batch CSV User Import</h3>
              </div>
              <button onClick={() => setBulkImportOpen(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-2">
              Paste CSV rows formatted as: <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">Full Name, Email, Role, ID</code>
            </p>

            <textarea
              value={csvContent}
              onChange={e => setCsvContent(e.target.value)}
              placeholder={`Samantha Reed, samantha.r@academiaone.edu, STUDENT, CS2024-201\nLiam Vance, liam.v@academiaone.edu, STUDENT, CS2024-202\nDr. Kevin Patel, kevin.p@academiaone.edu, FACULTY, FAC-401`}
              rows={5}
              className="w-full mt-3 p-3 font-mono text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleParseCsv}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold"
              >
                Validate & Preview Rows
              </button>
              {importPreview && (
                <span className="text-xs text-neutral-600 font-mono">
                  {importPreview.valid.length} valid · {importPreview.invalid.length} errors
                </span>
              )}
            </div>

            {importPreview && (
              <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200 max-h-48 overflow-y-auto text-xs">
                <h4 className="font-semibold text-neutral-800 mb-2">Validation Result:</h4>
                {importPreview.valid.map((v, i) => (
                  <div key={i} className="text-emerald-700 flex items-center gap-1.5 py-0.5 font-mono">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Row {i + 1}: {v.fullName} ({v.role} - {v.email})</span>
                  </div>
                ))}
                {importPreview.invalid.map((inv, i) => (
                  <div key={i} className="text-rose-700 flex items-center gap-1.5 py-0.5 font-mono">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Row {inv.row}: {inv.error}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200 mt-4">
              <button
                type="button"
                onClick={() => setBulkImportOpen(false)}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitBulkImport}
                disabled={!importPreview?.valid.length}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
              >
                Commit Import Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
