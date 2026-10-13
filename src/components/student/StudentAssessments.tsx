import React, { useState } from 'react';
import { db } from '../../services/db';
import { Assessment, Submission, User } from '../../types/lms';
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  Clock,
  Award,
  Send,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';

interface StudentAssessmentsProps {
  currentUser: User;
}

export const StudentAssessments: React.FC<StudentAssessmentsProps> = ({ currentUser }) => {
  const [assessments] = useState<Assessment[]>(db.getAssessments());
  const [submissions, setSubmissions] = useState<Submission[]>(
    db.getSubmissions(undefined, currentUser.id)
  );

  // Submission modal state
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const refreshSubmissions = () => {
    setSubmissions(db.getSubmissions(undefined, currentUser.id));
  };

  const handleOpenSubmit = (asmt: Assessment) => {
    setActiveAssessment(asmt);
    setSubmissionContent('');
    setSubmissionFileName(`${currentUser.fullName.toLowerCase().replace(/\s+/g, '_')}_solution.pdf`);
    setSubmissionSuccess(false);
  };

  const handleSubmitSolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssessment || !submissionContent.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      db.submitAssessment({
        assessmentId: activeAssessment.id,
        studentId: currentUser.id,
        content: submissionContent,
        fileName: submissionFileName,
      });
      setSubmitting(false);
      setSubmissionSuccess(true);
      refreshSubmissions();
      setTimeout(() => {
        setActiveAssessment(null);
      }, 1200);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Assignments, Quizzes & Published Results
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Submit coursework solutions, review rubric feedback, and verify official semester marks (PRD Section 8 & 12)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
            Current CGPA: 9.24 / 10.0
          </span>
        </div>
      </div>

      {/* Published Assessments List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">Active Coursework Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map(asmt => {
            const submission = submissions.find(s => s.assessmentId === asmt.id);
            const isSubmitted = !!submission;
            const isReleased = submission?.status === 'RELEASED';

            return (
              <div
                key={asmt.id}
                className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {asmt.type}
                    </span>
                    <span className="font-mono text-neutral-500 font-semibold">{asmt.totalMarks} Marks</span>
                  </div>

                  <h4 className="text-base font-bold text-neutral-900 leading-snug">{asmt.title}</h4>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">{asmt.courseName}</p>

                  <p className="text-xs text-neutral-600 mt-3 line-clamp-3 leading-relaxed">
                    {asmt.instructions}
                  </p>

                  {/* Rubric Points */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
                    <span className="text-[11px] font-semibold text-neutral-400 block uppercase">
                      Evaluation Rubric:
                    </span>
                    {asmt.rubric.map((r, i) => (
                      <div key={i} className="flex justify-between text-xs text-neutral-600">
                        <span>{r.criterion}</span>
                        <span className="font-mono text-neutral-500">{r.maxPoints} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-500 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {new Date(asmt.dueDate).toLocaleDateString()}</span>
                  </div>

                  {isReleased ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        Marks: {submission.marksObtained} / {asmt.totalMarks}
                      </span>
                    </div>
                  ) : isSubmitted ? (
                    <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-medium">
                      Submitted (In Grading)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenSubmit(asmt)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit Solution
                    </button>
                  )}
                </div>

                {/* If released with feedback, display feedback block */}
                {isReleased && submission?.feedback && (
                  <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-900 mb-0.5">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Evaluator Feedback:</span>
                    </div>
                    <p className="leading-relaxed">{submission.feedback}</p>
                    <span className="text-[11px] text-neutral-400 font-mono block mt-1">
                      Graded by: {submission.gradedBy}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Assignment Modal */}
      {activeAssessment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-neutral-200 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                Submit Assessment Response
              </h3>
              <button onClick={() => setActiveAssessment(null)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {submissionSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-neutral-900">Submission Recorded Successfully</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Immutable receipt issued. The instructor has been notified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitSolution} className="mt-4 space-y-4 text-xs">
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <span className="text-neutral-500 font-mono block">Target:</span>
                  <span className="font-bold text-neutral-900 text-sm block">
                    {activeAssessment.title} ({activeAssessment.courseName})
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Solution Response / Explanation
                  </label>
                  <textarea
                    value={submissionContent}
                    onChange={e => setSubmissionContent(e.target.value)}
                    placeholder="Describe your implementation details, analytical answers, or proof rationale..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Attached Artifact File Name
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={submissionFileName}
                      onChange={e => setSubmissionFileName(e.target.value)}
                      placeholder="e.g. ananya_assignment1.zip"
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setActiveAssessment(null)}
                    className="px-3.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Submitting...' : 'Confirm Submission'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
