/**
 * AcademiaOne - Unified Role-Based LMS
 * Master Application Entrypoint
 *
 * Implements PRD Section 1, 2, 3, 5, 28, 29:
 * - One unified web application, one shared database
 * - Single common authentication & login page
 * - Protected First-Run Administrator Bootstrap
 * - Automated role resolution & dynamic workspace shell
 */

import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User, UserRole } from './types/lms';
import { AuthPage } from './components/auth/AuthPage';
import { AppShell } from './components/layout/AppShell';

// Admin Modules
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagement } from './components/admin/UserManagement';
import { AcademicStructure } from './components/admin/AcademicStructure';
import { TimetableManagement } from './components/admin/TimetableManagement';
import { PolicySettings } from './components/admin/PolicySettings';
import { ModelOperations } from './components/admin/ModelOperations';
import { AuditLogsView } from './components/admin/AuditLogsView';

// Faculty Modules
import { FacultyDashboard } from './components/faculty/FacultyDashboard';
import { AttendanceManager } from './components/faculty/AttendanceManager';
import { AssessmentManager } from './components/faculty/AssessmentManager';
import { CourseAuthoring } from './components/faculty/CourseAuthoring';

// Student Modules
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentAttendance } from './components/student/StudentAttendance';
import { StudentAssessments } from './components/student/StudentAssessments';
import { StudentLearning } from './components/student/StudentLearning';
import { CRCaptureModal } from './components/student/CRCaptureModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(db.getCurrentUser());
  const [activeRole, setActiveRole] = useState<UserRole | null>(db.getActiveRole());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Set default tab on login or role change
  useEffect(() => {
    if (activeRole) {
      switch (activeRole) {
        case 'ADMIN':
          setCurrentTab('admin-dashboard');
          break;
        case 'FACULTY':
          setCurrentTab('faculty-dashboard');
          break;
        case 'STUDENT':
          setCurrentTab('student-dashboard');
          break;
        case 'AUDITOR':
          setCurrentTab('auditor-dashboard');
          break;
        default:
          setCurrentTab('student-dashboard');
      }
    }
  }, [activeRole]);

  const handleAuthenticated = (user: User, role: UserRole) => {
    setCurrentUser(user);
    setActiveRole(role);
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    const success = db.switchActiveRole(newRole);
    if (success) {
      setActiveRole(newRole);
    }
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setActiveRole(null);
  };

  // If unauthenticated: render single common login page (or first-run setup if no admin exists)
  if (!currentUser || !activeRole) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  // Render role-specific module based on active tab and authorized role
  const renderContent = () => {
    switch (currentTab) {
      // Admin Views
      case 'admin-dashboard':
        return <AdminDashboard onNavigateTab={setCurrentTab} />;
      case 'admin-users':
        return <UserManagement />;
      case 'admin-academic':
        return <AcademicStructure />;
      case 'admin-timetable':
        return <TimetableManagement />;
      case 'admin-attendance-sessions':
        return <AttendanceManager currentUser={currentUser} />;
      case 'admin-policy':
        return <PolicySettings />;
      case 'admin-model-ops':
        return <ModelOperations />;
      case 'admin-audit':
        return <AuditLogsView />;

      // Faculty Views
      case 'faculty-dashboard':
        return <FacultyDashboard currentUser={currentUser} onNavigateTab={setCurrentTab} />;
      case 'faculty-attendance':
        return <AttendanceManager currentUser={currentUser} />;
      case 'faculty-assessments':
        return <AssessmentManager currentUser={currentUser} />;
      case 'faculty-courseware':
        return <CourseAuthoring currentUser={currentUser} />;
      case 'faculty-timetable':
        return <TimetableManagement />;

      // Student Views
      case 'student-dashboard':
        return <StudentDashboard currentUser={currentUser} onNavigateTab={setCurrentTab} />;
      case 'student-attendance':
        return <StudentAttendance currentUser={currentUser} />;
      case 'student-assessments':
        return <StudentAssessments currentUser={currentUser} />;
      case 'student-learning':
        return <StudentLearning currentUser={currentUser} />;
      case 'student-timetable':
        return <TimetableManagement />;
      case 'student-cr-capture':
        return <CRCaptureModal currentUser={currentUser} onNavigateTab={setCurrentTab} />;

      // Auditor View
      case 'auditor-dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                AUDITOR COMPLIANCE VIEW
              </span>
              <h1 className="text-xl font-bold text-neutral-900 mt-2">
                Institutional Regulatory & Compliance Dashboard
              </h1>
              <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                Read-only inspection of system operations, immutable audit streams, and AI biometric governance compliance.
              </p>
            </div>
            <AuditLogsView />
          </div>
        );

      default:
        return <div className="p-8 text-center text-neutral-400">Loading module...</div>;
    }
  };

  return (
    <AppShell
      currentUser={currentUser}
      activeRole={activeRole}
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onRoleSwitch={handleRoleSwitch}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AppShell>
  );
}
