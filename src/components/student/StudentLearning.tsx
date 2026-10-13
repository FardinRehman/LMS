import React, { useState } from 'react';
import { db } from '../../services/db';
import { CourseMaterial, DoubtThread, User } from '../../types/lms';
import { BookOpen, HelpCircle, Send, CheckCircle, FileText, Video, MessageSquare } from 'lucide-react';

interface StudentLearningProps {
  currentUser: User;
}

export const StudentLearning: React.FC<StudentLearningProps> = ({ currentUser }) => {
  const [materials] = useState<CourseMaterial[]>(db.getCourseMaterials());
  const [doubts, setDoubts] = useState<DoubtThread[]>(db.getDoubts());

  // Ask doubt form
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [doubtPosted, setDoubtPosted] = useState(false);

  const handlePostDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) return;

    db.postDoubt('course-cs301', title, question, currentUser.id);
    setDoubts(db.getDoubts());
    setTitle('');
    setQuestion('');
    setDoubtPosted(true);
    setTimeout(() => setDoubtPosted(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
          Learning Content & Course Discussion
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Curriculum modules, downloadable slide decks, and direct academic question threads (PRD Section 8 & 14)
        </p>
      </div>

      {/* Materials Grid */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">Enrolled Course Resources (CS-301)</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {materials.map(mat => (
            <div key={mat.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 font-semibold">
                    {mat.type}
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">{mat.fileSize}</span>
                </div>
                <h4 className="font-bold text-neutral-900 text-sm leading-snug">{mat.title}</h4>
                <p className="text-neutral-500 mt-1">{mat.moduleName}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200/60 flex items-center justify-between">
                <span className="text-neutral-400 font-mono text-[11px]">{mat.publishedDate}</span>
                <button
                  onClick={() => alert(`Downloading ${mat.title} (${mat.fileSize})`)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Download / View &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discussion Forum & Doubt Threads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ask a Doubt Form */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-neutral-900">Ask Instructor a Question</h3>
          </div>
          <p className="text-xs text-neutral-500">
            Submit a conceptual query directly to Prof. Rajesh Sharma
          </p>

          {doubtPosted && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Query submitted to instructor queue!</span>
            </div>
          )}

          <form onSubmit={handlePostDoubt} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Subject / Topic</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Backpropagation equation clarification"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Detailed Question</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Explain the specific issue or slide number..."
                rows={4}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Post Query to Faculty
            </button>
          </form>
        </div>

        {/* Right: Existing Threads */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">Course Discussion History</h3>

          <div className="space-y-3">
            {doubts.map(d => (
              <div key={d.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/40 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">{d.title}</h4>
                    <span className="text-neutral-400 text-[11px] block mt-0.5">
                      By {d.studentName} · {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {d.status === 'RESOLVED' ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Answered by Instructor
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                      Under Review
                    </span>
                  )}
                </div>

                <p className="text-neutral-700 leading-relaxed bg-white p-3 rounded-lg border border-neutral-200">
                  {d.question}
                </p>

                {d.replies.map(rep => (
                  <div key={rep.id} className="ml-4 pl-3 border-l-2 border-indigo-400 space-y-1">
                    <span className="font-bold text-indigo-950 block">
                      {rep.authorName} ({rep.authorRole})
                    </span>
                    <p className="text-neutral-700 leading-relaxed">{rep.text}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
