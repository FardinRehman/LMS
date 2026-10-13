import React, { useState } from 'react';
import { db } from '../../services/db';
import { CourseMaterial, DoubtThread, User } from '../../types/lms';
import { BookOpen, Plus, MessageSquare, CheckCircle, FileText, Video, Send } from 'lucide-react';

interface CourseAuthoringProps {
  currentUser: User;
}

export const CourseAuthoring: React.FC<CourseAuthoringProps> = ({ currentUser }) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>(db.getCourseMaterials());
  const [doubts, setDoubts] = useState<DoubtThread[]>(db.getDoubts());
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  // Add material modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [moduleName, setModuleName] = useState('Module 2: Deep Metric Representations');
  const [type, setType] = useState<CourseMaterial['type']>('SLIDES');
  const [fileSize, setFileSize] = useState('3.2 MB');

  const courses = db.getCourses();

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    db.addCourseMaterial({
      courseId: 'course-cs301',
      title,
      moduleName,
      type,
      fileSize,
      url: '#',
    });
    setMaterials(db.getCourseMaterials());
    setShowAddModal(false);
    setTitle('');
  };

  const handleReplySubmit = (doubtId: string) => {
    const text = replyText[doubtId];
    if (!text?.trim()) return;

    db.replyToDoubt(doubtId, text, currentUser.id);
    setDoubts(db.getDoubts());
    setReplyText(prev => ({ ...prev, [doubtId]: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Courseware & Student Discussion
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Syllabus resources, lecture slides, and interactive doubt resolution (PRD Section 9 & 14)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Publish Learning Resource
        </button>
      </div>

      {/* Materials List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5">
        <h3 className="text-sm font-bold text-neutral-900 mb-3">Published Course Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {materials.map(mat => (
            <div key={mat.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 font-semibold">
                    {mat.type}
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">{mat.fileSize}</span>
                </div>
                <h4 className="text-sm font-bold text-neutral-900 leading-snug">{mat.title}</h4>
                <p className="text-xs text-neutral-500 mt-1">{mat.moduleName}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>{mat.publishedDate}</span>
                <span className="text-indigo-600 font-semibold">Accessible to Roster</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doubts and Discussion Threads */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Student Discussion & Academic Queries</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Course-scoped question threads with moderation</p>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {doubts.filter(d => d.status === 'UNRESOLVED').length} unresolved
          </span>
        </div>

        <div className="space-y-4">
          {doubts.map(doubt => (
            <div key={doubt.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/40 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 text-sm">{doubt.title}</span>
                  <span className="text-neutral-400 block mt-0.5">
                    Asked by {doubt.studentName} · {new Date(doubt.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {doubt.status === 'RESOLVED' ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolved
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                    Awaiting Instructor Response
                  </span>
                )}
              </div>

              <p className="text-neutral-700 leading-relaxed bg-white p-3 rounded-lg border border-neutral-200">
                {doubt.question}
              </p>

              {doubt.replies.map(rep => (
                <div key={rep.id} className="ml-4 pl-3 border-l-2 border-indigo-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-900">{rep.authorName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono">
                      {rep.authorRole}
                    </span>
                  </div>
                  <p className="text-neutral-700">{rep.text}</p>
                </div>
              ))}

              {/* Reply Box */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={replyText[doubt.id] || ''}
                  onChange={e => setReplyText({ ...replyText, [doubt.id]: e.target.value })}
                  placeholder="Write instructor response..."
                  className="flex-1 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleReplySubmit(doubt.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  Reply & Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-xl p-6">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Publish Learning Resource</h3>
            <form onSubmit={handleAddMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Resource Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Lecture 05: Backpropagation & Loss Surfaces"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Curriculum Module</label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={e => setModuleName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Media Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as CourseMaterial['type'])}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="SLIDES">Slides Presentation</option>
                    <option value="DOCUMENT">PDF Document / Lab</option>
                    <option value="VIDEO">Video Lecture Link</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">File Size</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={e => setFileSize(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold shadow-xs"
                >
                  Publish to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
