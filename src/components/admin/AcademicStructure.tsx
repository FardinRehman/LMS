import React, { useState } from 'react';
import { db } from '../../services/db';
import { Course, Department, Program, Section } from '../../types/lms';
import { Building, BookOpen, Layers, Users, Plus, Check } from 'lucide-react';

export const AcademicStructure: React.FC = () => {
  const [departments] = useState<Department[]>(db.getDepartments());
  const [programs] = useState<Program[]>(db.getPrograms());
  const [courses, setCourses] = useState<Course[]>(db.getCourses());
  const [sections] = useState<Section[]>(db.getSections());

  // Modal for new course
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('dept-cs');
  const [credits, setCredits] = useState(4);
  const [instructorId, setInstructorId] = useState('user-faculty-1');
  const [description, setDescription] = useState('');

  const facultyUsers = db.getUsers().filter(u => u.role === 'FACULTY');

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = facultyUsers.find(f => f.id === instructorId);
    const newCourse: Course = {
      id: 'course-' + Date.now(),
      code,
      name,
      departmentId,
      programId: 'prog-btech-cse',
      semester: 5,
      credits,
      instructorId,
      instructorName: inst?.fullName || 'Faculty Instructor',
      description,
      status: 'PUBLISHED',
    };
    const updated = [...courses, newCourse];
    setCourses(updated);
    // In a full DB, save to db
    setShowAddCourse(false);
    setCode('');
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Academic Architecture & Curriculum
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Departments, degree programs, published course offerings, and instructional rosters (PRD Section 7)
          </p>
        </div>

        <button
          onClick={() => setShowAddCourse(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Academic Course
        </button>
      </div>

      {/* High-level hierarchy cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold uppercase">
            <Building className="w-4 h-4" />
            <span>Departments</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {departments.length}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Computer Science, Electronics, Mechanical</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 text-purple-700 text-xs font-semibold uppercase">
            <Layers className="w-4 h-4" />
            <span>Degree Programs</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {programs.length}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Undergraduate B.Tech 4-Year Curricula</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Active Courses</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono tabular-nums">
            {courses.length}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Published syllabus with active sections</p>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Course Offerings & Faculty Assignment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <div key={course.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-indigo-700 text-xs">{course.code}</span>
                  <span className="text-xs font-mono font-semibold text-neutral-500">{course.credits} Credits</span>
                </div>
                <h4 className="text-sm font-bold text-neutral-900 leading-snug">{course.name}</h4>
                <p className="text-xs text-neutral-600 mt-2 line-clamp-2">{course.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200/60 text-xs text-neutral-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Instructor:</span>
                  <span className="font-semibold text-neutral-800">{course.instructorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Sections:</span>
                  <span className="font-mono">Section A, Section B</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
        <h3 className="text-sm font-bold text-neutral-900 mb-3">Sections & Class Representative (CR) Delegations</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Assigned classroom venues and authorized student capture representatives (PRD Section 10.2)
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="pb-2.5">Section Name</th>
                <th className="pb-2.5">Classroom Venue</th>
                <th className="pb-2.5">Delegated Class Representative</th>
                <th className="pb-2.5">Batch Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sections.map(s => (
                <tr key={s.id} className="hover:bg-neutral-50">
                  <td className="py-2.5 font-bold text-neutral-900">{s.name}</td>
                  <td className="py-2.5 font-medium text-neutral-700">{s.roomNumber}</td>
                  <td className="py-2.5">
                    <span className="text-purple-700 font-semibold">{s.crStudentName || 'Unassigned'}</span>
                    <span className="text-neutral-400 text-[11px] block">Authorized capture operator</span>
                  </td>
                  <td className="py-2.5 font-mono text-neutral-600">{s.batchYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-neutral-200 shadow-xl p-6">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Add Course Offering</h3>
            <form onSubmit={handleAddCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="CS-401"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Credits</label>
                  <input
                    type="number"
                    value={credits}
                    onChange={e => setCredits(Number(e.target.value))}
                    min={1}
                    max={6}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Course Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Advanced Cloud Architectures"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Assigned Instructor</label>
                <select
                  value={instructorId}
                  onChange={e => setInstructorId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                >
                  {facultyUsers.map(f => (
                    <option key={f.id} value={f.id}>{f.fullName} ({f.staffId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Syllabus Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Course scope, objectives, and prerequisites..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
