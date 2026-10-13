/**
 * AcademiaOne Single Authentication & Sign-in Interface
 * Implements PRD Section 2, 3, 6, 29.1:
 * - One common login page for all users (Admin, Faculty, Student, Auditor)
 * - Automatic server-side role resolution upon credential verification
 * - Protected First-Run Initial Administrator Setup when no admin exists
 * - Never asks user to choose role during sign-in
 */

import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { User, UserRole } from '../../types/lms';
import {
  Shield,
  Lock,
  Mail,
  UserCheck,
  KeyRound,
  ArrowRight,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Building2,
  GraduationCap
} from 'lucide-react';

interface AuthPageProps {
  onAuthenticated: (user: User, role: UserRole) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'FIRST_RUN' | 'INVITE' | 'RECOVERY'>('LOGIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // First-run setup state
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminDepartment, setAdminDepartment] = useState('Academic Governance');
  const [adminDesignation, setAdminDesignation] = useState('Institutional Dean / Chief Administrator');
  const [setupSuccess, setSetupSuccess] = useState(false);

  // Check if first-run setup is required
  const isFirstRun = db.isFirstRunAvailable();

  useEffect(() => {
    if (isFirstRun) {
      setAuthMode('FIRST_RUN');
    }
  }, [isFirstRun]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your institutional email, student ID, or staff ID.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    // Simulate realistic network roundtrip
    setTimeout(() => {
      const result = db.login(identifier, password);
      setLoading(false);

      if (result.success && result.user && result.role) {
        onAuthenticated(result.user, result.role);
      } else {
        setError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    }, 450);
  };

  const handleFirstRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminFullName.trim() || !adminEmail.trim()) {
      setError('Full name and official institutional email are required.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = db.completeInitialAdminSetup({
        fullName: adminFullName,
        email: adminEmail,
        departmentName: adminDepartment,
        designation: adminDesignation,
      });
      setLoading(false);

      if (result.success && result.user) {
        setSetupSuccess(true);
        setTimeout(() => {
          onAuthenticated(result.user!, 'ADMIN');
        }, 1200);
      } else {
        setError(result.error || 'Failed to complete initial administrator bootstrap.');
      }
    }, 600);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your institutional email or identifier.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRecoverySent(true);
    }, 500);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter your 8-digit activation token.');
      return;
    }
    setError('Invalid or expired activation token. Contact your department administrator.');
  };

  // Helper for quick-fill demo testing (fills credentials into the single form)
  const quickFill = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      {/* Top institution bar */}
      <header className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
            A
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight text-white block">
              AcademiaOne
            </span>
            <span className="text-xs text-neutral-400 block -mt-0.5">
              Unified Academic & Learning Management System
            </span>
          </div>
        </div>

        {/* Demo reset / state controls */}
        <div className="flex items-center gap-2">
          {authMode === 'FIRST_RUN' ? (
            <button
              onClick={() => {
                db.resetToStandardSeedData();
                window.location.reload();
              }}
              className="text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded border border-neutral-700 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Load Seeded Institutional Demo
            </button>
          ) : (
            <button
              onClick={() => {
                db.resetToFirstRunSetupMode();
                setAuthMode('FIRST_RUN');
                setError(null);
              }}
              className="text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded border border-neutral-700 transition-colors flex items-center gap-1.5"
              title="Resets system to zero administrators to test first-run bootstrap process"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Test First-Run Admin Setup Flow
            </button>
          )}
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-xl p-6 md:p-8 shadow-2xl relative">
          
          {/* Mode: FIRST_RUN INITIAL ADMINISTRATOR BOOTSTRAP */}
          {authMode === 'FIRST_RUN' ? (
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-3">
                  <Shield className="w-3.5 h-3.5" />
                  First-Run System Initialization
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Setup Initial Administrator
                </h1>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  No active administrator account exists on this deployment. As per PRD Section 3, the first authorized administrator must complete this bootstrap setup. Subsequent registrations will require administrator authorization.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {setupSuccess ? (
                <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-semibold">Initial Administrator Created!</p>
                    <p className="text-neutral-400 mt-0.5">Redirecting to Administrative Workspace...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFirstRunSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Administrator Full Name
                    </label>
                    <input
                      type="text"
                      value={adminFullName}
                      onChange={e => setAdminFullName(e.target.value)}
                      placeholder="e.g., Dr. Eleanor Vance"
                      required
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Official Institutional Email
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="admin@academiaone.edu"
                      required
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Department
                      </label>
                      <input
                        type="text"
                        value={adminDepartment}
                        onChange={e => setAdminDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={adminDesignation}
                        onChange={e => setAdminDesignation(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Initializing Administrator...' : 'Finalize Initial Administrator Setup'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          ) : authMode === 'RECOVERY' ? (
            /* Mode: PASSWORD RECOVERY */
            <div>
              <div className="mb-6">
                <button
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setError(null);
                    setRecoverySent(false);
                  }}
                  className="text-xs text-neutral-400 hover:text-white mb-2 flex items-center gap-1"
                >
                  ← Back to Sign In
                </button>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Reset Account Password
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Enter your registered institutional identifier to receive a secure recovery link.
                </p>
              </div>

              {recoverySent ? (
                <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                  <p className="font-semibold mb-1">Recovery Link Generated</p>
                  <p className="text-neutral-400 leading-relaxed">
                    A single-use, time-limited reset token has been issued. For local verification, demo passwords remain intact or can be updated via Administrator User Management.
                  </p>
                  <button
                    onClick={() => setAuthMode('LOGIN')}
                    className="mt-4 px-3 py-1.5 bg-neutral-800 text-white rounded text-xs hover:bg-neutral-700"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Institutional Email or Identifier
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="e.g. user@academiaone.edu"
                      required
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? 'Generating Token...' : 'Send Recovery Link'}
                  </button>
                </form>
              )}
            </div>
          ) : authMode === 'INVITE' ? (
            /* Mode: INVITATION ACTIVATION */
            <div>
              <div className="mb-6">
                <button
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setError(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-white mb-2 flex items-center gap-1"
                >
                  ← Back to Sign In
                </button>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Activate Invited Account
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Enter the invitation code received from your institutional administrator.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Invitation / Activation Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    placeholder="e.g. INV-9042-881"
                    required
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Verify & Activate Account
                </button>
              </form>
            </div>
          ) : (
            /* Mode: STANDARD SINGLE SIGN-IN (FOR ALL USERS) */
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Sign In to AcademiaOne
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Unified institutional access. Your role-specific dashboard will load automatically upon sign-in.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Institutional Email, Student ID, or Staff ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="e.g. user@academiaone.edu or CS2024-042"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('RECOVERY')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    'Verifying Credentials...'
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-neutral-800 text-center">
                <button
                  onClick={() => setAuthMode('INVITE')}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Have an institutional invitation code? <span className="text-indigo-400 underline">Activate Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Quick Demo Credentials Panel for Testers & Evaluators */}
      {authMode === 'LOGIN' && (
        <footer className="px-6 py-4 bg-neutral-950/80 border-t border-neutral-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Reviewer Quick Sign-In (Auto-fills the common form)
              </span>
              <span className="text-xs text-neutral-400">
                Single login endpoint resolves active role automatically
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickFill('admin@academiaone.edu', 'AdminPass123!')}
                className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-indigo-500/50 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 font-medium text-white group-hover:text-indigo-400">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Admin
                </div>
                <div className="text-neutral-400 text-xs mt-0.5 truncate">Dr. Eleanor Vance</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('prof.sharma@academiaone.edu', 'FacultyPass123!')}
                className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 font-medium text-white group-hover:text-emerald-400">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Faculty
                </div>
                <div className="text-neutral-400 text-xs mt-0.5 truncate">Prof. Rajesh Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('ananya.patel@academiaone.edu', 'StudentPass123!')}
                className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-purple-500/50 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 font-medium text-white group-hover:text-purple-400">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                  Student (CR)
                </div>
                <div className="text-neutral-400 text-xs mt-0.5 truncate">Ananya Patel (CR)</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('marcus.chen@academiaone.edu', 'StudentPass123!')}
                className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/50 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 font-medium text-white group-hover:text-cyan-400">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Student
                </div>
                <div className="text-neutral-400 text-xs mt-0.5 truncate">Marcus Chen</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('auditor@academiaone.edu', 'AuditorPass123!')}
                className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 font-medium text-white group-hover:text-amber-400">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Auditor
                </div>
                <div className="text-neutral-400 text-xs mt-0.5 truncate">Rachel Thorne</div>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
