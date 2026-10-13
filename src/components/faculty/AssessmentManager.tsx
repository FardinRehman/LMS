import React, { useState } from 'react';
import { db } from '../../services/db';
import { Assessment, Submission, User } from '../../types/lms';
import {
  FileCheck2,
  Plus,
  CheckCircle,
  Clock,
  Send,
  Users,
  Award,
  X,
  FileText
} from 'lucide-react';

interface AssessmentManagerProps {
  currentUser: User;
}

export const AssessmentManager: React.FC<AssessmentManagerProps> = ({ currentUser }) => {
  const [assessments, setAssessments] = useState<Assessment[]>(db.getAssessments());
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || ''
  );
  const [submissions, setSubmissions] = useState<Submission[]>(db.getSubmissions());

  // Create assessment modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Assessment['type']>('ASSIGNMENT');
  const [courseId, setCourseId] = useState('course-cs301');
  const [totalMarks, setTotalMarks] = useState(50);
  const [passMarks, setPassMarks] = useState(25);
  const [dueDate, setDueDate] = useState('2026-10-25T23:59');
  const [instructions, setInstructions] = useState('');

  // Grading modal
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(45);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  const courses = db.getCourses();

  const refreshData = () => {
    setAssessments(db.getAssessments());
    setSubmissions(db.getSubmissions());
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const selCourse = courses.find(c => c.id === courseId);
    db.createAssessment({
      courseId,
      courseName: selCourse?.name || 'Course',
      sectionId: 'sec-cs301-a',
      title,
      type,
      totalMarks,
      passMarks,
      dueDate: new Date(dueDate).toISOString(),
      instructions,
      rubric: [
        { criterion: 'Implementation & Logic', maxPoints: Math.round(totalMarks * 0.6) },
        { criterion: 'Documentation & Analysis', maxPoints: Math.round(totalMarks * 0.4) },
      ],
      status: 'PUBLISHED',
    });

    setShowCreateModal(false);
    setTitle('');
    setInstructions('');
    refreshData();
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    db.gradeSubmission(
      gradingSubmission.id,
      gradeMarks,
      gradeFeedback || 'Satisfactory completion of assessment requirements.',
      currentUser.id
    );

    setGradingSubmission(null);
    refreshData();
  };

  const activeAssessment = assessments.find(a => a.id === selectedAssessmentId);
  const activeSubmissions = submissions.filter(
    s => s.assessmentId === selectedAssessmentId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Assessments, Quizzes & Grading
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure rubrics, evaluate student submissions, and release verified gradebook marks (PRD Section 12)
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Assessment
        </button>
      </div>

      {/* Assessment Selector Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assessments.map(asmt => {
          const isSelected = asmt.id === selectedAssessmentId;
          const subs = submissions.filter(s => s.assessmentId === asmt.id);
          const gradedCount = subs.filter(s => s.status === 'RELEASED').length;

          return (
            <div
              key={asmt.id}
              onClick={() => setSelectedAssessmentId(asmt.id)}
              className={`p-4 rounded-xl border bg-white cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/10'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {asmt.type}
                </span>
                <span className="font-mono text-neutral-500 font-semibold">{asmt.totalMarks} Marks</span>
              </div>
              <h4 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-1">
                {asmt.title}
              </h4>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">{asmt.courseName}</p>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-mono">
                <span>{subs.length} Submissions</span>
                <span className="text-emerald-700 font-bold">{gradedCount} Graded</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Assessment Workspace */}
      {activeAssessment && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {activeAssessment.type}
                </span>
                <span className="text-xs text-neutral-500">
                  Pass Mark: <span className="font-mono font-bold text-neutral-900">{activeAssessment.passMarks}</span> / {activeAssessment.totalMarks}
                </span>
              </div>
              <h2 className="text-base font-bold text-neutral-900">{activeAssessment.title}</h2>
              <p className="text-xs text-neutral-600 mt-1 max-w-2xl">{activeAssessment.instructions}</p>
            </div>

            <div className="text-xs text-neutral-500 font-mono shrink-0">
              Due Date: {new Date(activeAssessment.dueDate).toLocaleDateString()}
            </div>
          </div>

          {/* Submissions Table */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Student Submissions & Evaluation Queue</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                    <th className="py-2.5 px-3">Student & Roll No</th>
                    <th className="py-2.5 px-3">Submitted At</th>
                    <th className="py-2.5 px-3">Artifact File</th>
                    <th className="py-2.5 px-3">Grade Awarded</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {activeSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">
                        No submissions received yet for this assessment.
                      </td>
                    </tr>
                  ) : (
                    activeSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-neutral-50">
                        <td className="py-3 px-3">
                          <span className="font-bold text-neutral-900 block">{sub.studentName}</span>
                          <span className="text-neutral-500 font-mono text-[11px] block">{sub.rollNumber}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-600">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-indigo-600 flex items-center gap-1.5 mt-2">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{sub.fileName || 'submission.zip'}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                          {sub.marksObtained !== undefined ? (
                            <span>{sub.marksObtained} / {activeAssessment.totalMarks}</span>
                          ) : (
                            <span className="text-neutral-400 font-normal">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {sub.status === 'RELEASED' ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Released to Student
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Draft / Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setGradingSubmission(sub);
                              setGradeMarks(sub.marksObtained || Math.round(activeAssessment.totalMarks * 0.85));
                              setGradeFeedback(sub.feedback || '');
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-xs"
                          >
                            {sub.status === 'RELEASED' ? 'Review / Regrade' : 'Grade & Feedback'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grading Evaluation Modal */}
      {gradingSubmission && activeAssessment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-neutral-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">Evaluate Student Submission</h3>
              <button onClick={() => setGradingSubmission(null)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 my-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Student:</span>
                <span className="font-bold text-neutral-900">{gradingSubmission.studentName} ({gradingSubmission.rollNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Assessment:</span>
                <span className="font-mono text-neutral-800">{activeAssessment.title}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200">
                <span className="text-neutral-500 block mb-0.5">Submitted Content:</span>
                <p className="text-neutral-700 leading-snug">{gradingSubmission.content}</p>
              </div>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Marks Awarded (Max: {activeAssessment.totalMarks})
                </label>
                <input
                  type="number"
                  min={0}
                  max={activeAssessment.totalMarks}
                  value={gradeMarks}
                  onChange={e => setGradeMarks(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-base text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Qualitative Evaluator Feedback
                </label>
                <textarea
                  value={gradeFeedback}
                  onChange={e => setGradeFeedback(e.target.value)}
                  placeholder="Provide feedback on algorithm convergence, code cleanliness, rubric scores..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Publish & Release Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-neutral-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">Create New Assessment</h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Course</label>
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
                  <label className="block font-semibold text-neutral-700 mb-1">Assessment Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as Assessment['type'])}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="QUIZ">Online Quiz</option>
                    <option value="MIDTERM">Midterm Exam</option>
                    <option value="FINAL_EXAM">Final Exam</option>
                    <option value="LAB">Lab Practical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Assignment 2: Deep Metric Loss Functions"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={e => setTotalMarks(Number(e.target.value))}
                    min={5}
                    max={100}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={passMarks}
                    onChange={e => setPassMarks(Number(e.target.value))}
                    min={1}
                    max={totalMarks}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Instructions</label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Submission formats, guidelines, late submission policy..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold shadow-xs"
                >
                  Publish Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
