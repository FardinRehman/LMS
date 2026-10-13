/**
 * AcademiaOne Unified Application Shell
 * Implements PRD Section 5 & 29.1:
 * - One shared shell with dynamic role-aware navigation
 * - Header with institutional branding, notification center, profile menu
 * - Multi-role & CR delegation workspace switcher
 * - Responsive navigation
 */

import React, { useState } from 'react';
import { User, UserRole } from '../../types/lms';
import { db } from '../../services/db';
import { NotificationDrawer } from '../common/NotificationDrawer';
import {
  LayoutDashboard,
  Users,
  Building,
  Calendar,
  Camera,
  BookOpen,
  FileCheck2,
  Sliders,
  Cpu,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface AppShellProps {
  currentUser: User;
  activeRole: UserRole;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onRoleSwitch: (role: UserRole) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentUser,
  activeRole,
  currentTab,
  onSelectTab,
  onRoleSwitch,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const unreadCount = db.getNotifications(currentUser.id).filter(n => !n.read).length;

  // Build navigation items dynamically strictly based on active role
  const getNavItems = () => {
    switch (activeRole) {
      case 'ADMIN':
        return [
          { id: 'admin-dashboard', label: 'Dashboard & Metrics', icon: LayoutDashboard },
          { id: 'admin-users', label: 'User & Role Management', icon: Users },
          { id: 'admin-academic', label: 'Academic Structure', icon: Building },
          { id: 'admin-timetable', label: 'Timetable & Scheduling', icon: Calendar },
          { id: 'admin-attendance-sessions', label: 'Attendance Sessions', icon: Camera },
          { id: 'admin-policy', label: 'Policy Configuration', icon: Sliders },
          { id: 'admin-model-ops', label: 'AI Model Governance', icon: Cpu },
          { id: 'admin-audit', label: 'Audit Trail & Security', icon: ShieldCheck },
        ];
      case 'FACULTY':
        return [
          { id: 'faculty-dashboard', label: 'Teaching Overview', icon: LayoutDashboard },
          { id: 'faculty-attendance', label: 'Attendance & AI Verification', icon: Camera },
          { id: 'faculty-assessments', label: 'Assessments & Grading', icon: FileCheck2 },
          { id: 'faculty-courseware', label: 'Course Content & Syllabus', icon: BookOpen },
          { id: 'faculty-timetable', label: 'Schedule & Classes', icon: Calendar },
        ];
      case 'STUDENT':
        return [
          { id: 'student-dashboard', label: 'Student Home', icon: LayoutDashboard },
          { id: 'student-attendance', label: 'My Attendance & Risk', icon: Camera },
          { id: 'student-assessments', label: 'Assignments & Quizzes', icon: FileCheck2 },
          { id: 'student-learning', label: 'Course Materials & Doubts', icon: BookOpen },
          { id: 'student-timetable', label: 'Weekly Timetable', icon: Calendar },
          ...(currentUser.isCR
            ? [{ id: 'student-cr-capture', label: 'CR Attendance Capture', icon: Sparkles }]
            : []),
        ];
      case 'AUDITOR':
        return [
          { id: 'auditor-dashboard', label: 'Compliance Overview', icon: LayoutDashboard },
          { id: 'admin-audit', label: 'Immutable Audit Trail', icon: ShieldCheck },
          { id: 'admin-model-ops', label: 'AI Model Metrics & Releases', icon: Cpu },
          { id: 'admin-policy', label: 'Policy Verification', icon: Sliders },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Multi-role switching options
  const availableRoles: UserRole[] = [currentUser.role];
  if (currentUser.secondaryRoles) {
    currentUser.secondaryRoles.forEach(r => {
      if (!availableRoles.includes(r)) availableRoles.push(r);
    });
  }
  if (currentUser.role === 'ADMIN' && !availableRoles.includes('FACULTY')) {
    availableRoles.push('FACULTY'); // Admins can switch to faculty view
  }
  if (currentUser.isCR && !availableRoles.includes('STUDENT')) {
    availableRoles.push('STUDENT');
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Shared Application Header */}
      <header className="h-14 bg-white border-b border-neutral-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Brand & Left Context */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-neutral-600 hover:text-neutral-900 rounded"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
              A
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-tight text-neutral-900 block">
                AcademiaOne
              </span>
              <span className="text-xs text-neutral-500 hidden sm:block">
                Unified Academic Workspace
              </span>
            </div>
          </div>

          {/* Active Workspace / Role Indicator */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-neutral-200">
            <span className="text-xs text-neutral-500 font-medium">Workspace:</span>
            <div className="flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 rounded text-xs font-semibold text-neutral-800 border border-neutral-200">
              {activeRole === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
              {activeRole === 'FACULTY' && <Building className="w-3.5 h-3.5 text-emerald-600" />}
              {activeRole === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5 text-purple-600" />}
              {activeRole === 'AUDITOR' && <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
              <span>{activeRole} DASHBOARD</span>
            </div>
          </div>
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-role Workspace Switcher */}
          {availableRoles.length > 1 && (
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded border border-neutral-200">
              <span className="text-xs text-neutral-500 pl-1 font-medium hidden sm:inline">Switch Role:</span>
              {availableRoles.map(r => (
                <button
                  key={r}
                  onClick={() => onRoleSwitch(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    activeRole === r
                      ? 'bg-white text-indigo-700 shadow-xs border border-neutral-200'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Notification Center */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-neutral-100 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-200 overflow-hidden shrink-0 border border-neutral-300">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-neutral-600">
                    {currentUser.fullName[0]}
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-neutral-900 block truncate max-w-[120px]">
                  {currentUser.fullName}
                </span>
                <span className="text-xs text-neutral-500 block truncate max-w-[120px]">
                  {currentUser.email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg p-2 z-50">
                <div className="p-2 border-b border-neutral-100 mb-1">
                  <p className="text-xs font-semibold text-neutral-900">{currentUser.fullName}</p>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">{currentUser.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                      Role: {currentUser.role}
                    </span>
                    {currentUser.isCR && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                        CR Delegated
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    db.resetToStandardSeedData();
                    window.location.reload();
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs text-neutral-700 hover:bg-neutral-50 rounded flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                  Reset Institutional Seed Data
                </button>

                <button
                  onClick={onLogout}
                  className="w-full text-left px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded flex items-center gap-2 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Workspace Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Role-aware) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 shrink-0">
          <div className="p-4 border-b border-neutral-100">
            <span className="text-xs uppercase font-bold tracking-wider text-neutral-700 block">
              {activeRole} NAVIGATION
            </span>
            <span className="text-xs text-neutral-500 block mt-0.5">
              Authorized modules only
            </span>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-neutral-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Context Footer */}
          <div className="p-3 border-t border-neutral-200 bg-neutral-50/50">
            <div className="text-xs text-neutral-500 flex items-center justify-between">
              <span>Security State</span>
              <span className="font-mono text-emerald-600 font-semibold">RBAC Verified</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              User ID: <span className="font-mono">{currentUser.id.slice(0, 12)}...</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full shadow-2xl flex flex-col p-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <span className="text-xs font-bold uppercase text-neutral-500">
                  {activeRole} Modules
                </span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-neutral-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <button
                onClick={onLogout}
                className="w-full py-2.5 text-xs text-rose-600 font-medium border border-rose-200 rounded-lg flex items-center justify-center gap-2 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Workspace Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-100">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationDrawer
        userId={currentUser.id}
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={link => {
          if (link.includes('attendance')) {
            onSelectTab(activeRole === 'STUDENT' ? 'student-attendance' : 'faculty-attendance');
          } else if (link.includes('assessment')) {
            onSelectTab(activeRole === 'STUDENT' ? 'student-assessments' : 'faculty-assessments');
          }
        }}
      />
    </div>
  );
};
