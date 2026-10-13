import React, { useState } from 'react';
import { db } from '../../services/db';
import { ScheduledClass } from '../../types/lms';
import { Calendar, Plus, Clock, MapPin, AlertCircle, CheckCircle, X } from 'lucide-react';

export const TimetableManagement: React.FC = () => {
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>(db.getScheduledClasses());
  const [dayFilter, setDayFilter] = useState<string>('ALL');

  // New class modal
  const [showAddClass, setShowAddClass] = useState(false);
  const [courseId, setCourseId] = useState('course-cs301');
  const [sectionId, setSectionId] = useState('sec-cs301-a');
  const [instructorId, setInstructorId] = useState('user-faculty-1');
  const [dayOfWeek, setDayOfWeek] = useState<ScheduledClass['dayOfWeek']>('Tuesday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [room, setRoom] = useState('Hall 302 (Turing Auditorium)');
  const [conflictError, setConflictError] = useState<string | null>(null);

  const courses = db.getCourses();
  const sections = db.getSections();
  const faculty = db.getUsers().filter(u => u.role === 'FACULTY');

  const refreshClasses = () => {
    setScheduledClasses(db.getScheduledClasses());
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const selCourse = courses.find(c => c.id === courseId);
    const selSection = sections.find(s => s.id === sectionId);
    const selFaculty = faculty.find(f => f.id === instructorId);

    const result = db.createScheduledClass({
      courseId,
      courseCode: selCourse?.code || 'CS',
      courseName: selCourse?.name || 'Course',
      sectionId,
      sectionName: selSection?.name || 'Section',
      instructorId,
      instructorName: selFaculty?.fullName || 'Instructor',
      dayOfWeek,
      startTime,
      endTime,
      room,
      status: 'SCHEDULED',
    });

    if (result.success) {
      setShowAddClass(false);
      refreshClasses();
    } else {
      setConflictError(result.error || 'Failed to schedule class.');
    }
  };

  const handleCancelClass = (id: string) => {
    const classes = db.getScheduledClasses();
    const cl = classes.find(c => c.id === id);
    if (cl) {
      cl.status = 'CANCELLED';
      // In localStorage:
      localStorage.setItem('academia_one_lms_scheduled_classes', JSON.stringify(classes));
      refreshClasses();
    }
  };

  const filtered = scheduledClasses.filter(c =>
    dayFilter === 'ALL' || c.dayOfWeek === dayFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Timetable & Class Scheduling
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Published class occurrences with room & instructor conflict validation (PRD Section 13)
          </p>
        </div>

        <button
          onClick={() => setShowAddClass(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule Class Occurrence
        </button>
      </div>

      {/* Days Filter */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-neutral-500 font-medium px-2 shrink-0">Filter Day:</span>
        {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
          <button
            key={day}
            onClick={() => setDayFilter(day)}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
              dayFilter === day
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Class Occurrences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div
            key={item.id}
            className={`p-5 rounded-xl border bg-white shadow-xs flex flex-col justify-between ${
              item.status === 'CANCELLED'
                ? 'border-neutral-200 opacity-60'
                : item.status === 'OPEN'
                ? 'border-indigo-400 ring-2 ring-indigo-500/10'
                : 'border-neutral-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {item.dayOfWeek} · {item.startTime} - {item.endTime}
                </span>
                <span className={`text-[11px] font-bold uppercase font-mono ${
                  item.status === 'OPEN'
                    ? 'text-emerald-700'
                    : item.status === 'CANCELLED'
                    ? 'text-rose-600'
                    : item.status === 'COMPLETED'
                    ? 'text-neutral-700'
                    : 'text-indigo-600'
                }`}>
                  {item.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-neutral-900 leading-snug">
                {item.courseName}
              </h4>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.courseCode} · {item.sectionName}</p>

              <div className="mt-4 space-y-1.5 text-xs text-neutral-600 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{item.room}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Instructor: {item.instructorName}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">ID: {item.id}</span>
              {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleCancelClass(item.id)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                >
                  Cancel Class
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Occurrence Modal */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-neutral-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">Schedule Class Occurrence</h3>
              <button onClick={() => setShowAddClass(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {conflictError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClass} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Course Offering</label>
                <select
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Section</label>
                  <select
                    value={sectionId}
                    onChange={e => setSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Instructor</label>
                  <select
                    value={instructorId}
                    onChange={e => setInstructorId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={e => setDayOfWeek(e.target.value as ScheduledClass['dayOfWeek'])}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Room / Venue</label>
                <input
                  type="text"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="e.g. Hall 302 (Turing Auditorium)"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Confirm & Check Conflict
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
