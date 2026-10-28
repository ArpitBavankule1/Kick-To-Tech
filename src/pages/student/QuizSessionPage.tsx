import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Award,
  Clock,
  Code2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import {
  studentService,
  type EnrolledSubjectItem,
} from '../../services/student.service';
import type { Assignment, DbQuestion, Topic } from '../../types/database';
import { getStatus } from '../../engine';

interface AnsweredRecord {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  explanation: string;
  wrongReason: string | null;
}

export const QuizSessionPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error } = useToast();

  const studentId = user?.id || 'std-mock-1';
  const todayDate = new Date().toISOString().split('T')[0];

  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [subject, setSubject] = useState<EnrolledSubjectItem | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<DbQuestion[]>([]);

  // Sequential quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeredHistory, setAnsweredHistory] = useState<AnsweredRecord[]>([]);

  // ARIA live feedback text for screen readers
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');

  // Concept Review Modal state
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);

  // 1. Fetch assignment and questions
  const loadQuizSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const enrolled = await studentService.getEnrolledSubjects(studentId);
      if (enrolled.length === 0) {
        setIsLoading(false);
        return;
      }

      const activeSubject = enrolled[0];
      setSubject(activeSubject);

      const [topicsList, todayAsgn] = await Promise.all([
        studentService.getSubjectTopics(activeSubject.subject_id),
        studentService.getTodayAssignment(activeSubject.subject_id, todayDate),
      ]);

      setTopics(topicsList);
      setAssignment(todayAsgn);

      if (todayAsgn && todayAsgn.status === 'published') {
        const qList = await studentService.getAssignmentQuestions(
          todayAsgn.id,
          activeSubject.subject_id,
          todayAsgn.topic_id
        );
        setQuestions(qList);
      } else {
        setQuestions([]);
      }
    } catch {
      error('Failed to load assignment quiz session.');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, todayDate, error]);

  useEffect(() => {
    loadQuizSession();
  }, [loadQuizSession]);

  const currentQuestion: DbQuestion | undefined = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isQuizCompleted = questions.length > 0 && answeredHistory.length === questions.length;

  const currentTopic = useMemo(() => {
    if (!currentQuestion) return null;
    return topics.find(t => t.id === currentQuestion.topic_id) || null;
  }, [topics, currentQuestion]);

  // Handle option selection (only allowed before submission)
  const handleSelectOption = (index: number) => {
    if (isAnswered || isSubmitting) return;
    setSelectedOption(index);
  };

  // Submit attempt with double-click guard
  const handleSubmitAttempt = async () => {
    if (selectedOption === null || isAnswered || isSubmitting || !currentQuestion) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await studentService.submitQuizAttempt({
        studentId,
        subjectId: subject?.subject_id || currentQuestion.subject_id,
        topicId: currentQuestion.topic_id,
        questionId: currentQuestion.id,
        assignmentId: assignment?.id || assignmentId || null,
        selectedAnswer: selectedOption,
        question: currentQuestion,
      });

      const isCorrect = result.is_correct;
      const wrongReason = result.wrong_reason;

      // Update answered history
      const record: AnsweredRecord = {
        questionId: currentQuestion.id,
        selectedOption,
        isCorrect,
        explanation: result.explanation || currentQuestion.explanation,
        wrongReason,
      };

      setAnsweredHistory(prev => [...prev, record]);
      setIsAnswered(true);

      // Trigger Screen Reader aria-live announcement
      const optionLetter = String.fromCharCode(65 + selectedOption);
      const announcement = isCorrect
        ? `Result: Correct! Option ${optionLetter} is correct. Explanation: ${record.explanation}`
        : `Result: Not quite. Option ${optionLetter} was incorrect. ${wrongReason ? `Reason: ${wrongReason}. ` : ''}Explanation: ${record.explanation}`;

      setAriaAnnouncement(announcement);
    } catch {
      error('Failed to record attempt. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advance to next question
  const handleNextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setAriaAnnouncement('');
    }
  };

  // Overall Score
  const score = useMemo(() => {
    const correctCount = answeredHistory.filter(h => h.isCorrect).length;
    const total = answeredHistory.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return { correctCount, total, percentage, status: getStatus(percentage) };
  }, [answeredHistory]);

  // Empty state 1: No subject enrolled
  if (!isLoading && !subject) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto">
        <EmptyState
          icon={<BookOpen size={32} />}
          title="No Subject Joined"
          description="You must be enrolled in a subject to access quizzes."
          actionText="Go to Student Dashboard"
          onAction={() => navigate('/student')}
        />
      </div>
    );
  }

  // Empty state 2: No published assignment today
  if (!isLoading && (!assignment || assignment.status !== 'published' || questions.length === 0)) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto">
        <EmptyState
          icon={<Clock size={32} />}
          title="No Published Assignment Today"
          description="Your teacher has not published an active quiz assignment for today. Quizzes are only accessible once reviewed and published."
          actionText="Back to Student Dashboard"
          onAction={() => navigate('/student')}
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto space-y-6">
        <Skeleton height={32} width={200} />
        <Skeleton height={80} />
        <Skeleton height={260} />
      </div>
    );
  }

  // Empty state 3: Quiz Completed state
  if (isQuizCompleted) {
    return (
      <div className="py-10 px-4 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </Link>
          <Badge variant="cyan" size="sm">
            Assignment Completed
          </Badge>
        </div>

        <Card className="text-center py-10 px-6 space-y-5 border-cyan-500/20 bg-gradient-to-b from-slate-900/60 to-slate-950">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Award size={36} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold text-slate-100">
              Quiz Completed!
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your attempts have been securely committed to the telemetry ledger. The Phase 4 Engine has updated your mastery and trend calculations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 max-w-sm mx-auto flex items-center justify-around text-center">
            <div>
              <div className="text-2xl font-extrabold text-cyan-400">
                {score.correctCount} / {score.total}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Score ({score.percentage}%)
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-base font-bold text-slate-200 capitalize">
                {score.status}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Engine Status
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button
              size="md"
              onClick={() => navigate('/student')}
              rightIcon={<ArrowRight size={16} />}
            >
              View Updated Knowledge Map
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Active Quiz View
  return (
    <div className="py-8 px-4 max-w-3xl mx-auto space-y-6">
      {/* Aria-Live Screen Reader Announcement Container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
        data-testid="aria-live-result"
      >
        {ariaAnnouncement}
      </div>

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft size={14} />
          <span>Exit to Student Dashboard</span>
        </Link>

        {/* Mandatory Quiz Label */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold shadow-xs">
          <Sparkles size={13} className="shrink-0" />
          <span>AI-generated, reviewed by your teacher</span>
        </div>
      </div>

      {/* Progress & Topic Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-slate-200">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>•</span>
          <span className="text-cyan-500 font-medium">
            {currentTopic?.name || 'Computer Science Topic'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentQuestion && (
            <Badge variant="default" size="sm">
              {currentQuestion.difficulty.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Active Question Card */}
      {currentQuestion && (
        <Card className="space-y-6">
          {/* Question Prompt */}
          <div className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentQuestion.question}
            </h2>

            {currentQuestion.code_snippet && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-400 overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-500 font-sans">
                  <span className="flex items-center gap-1">
                    <Code2 size={12} />
                    <span>C Code Snippet</span>
                  </span>
                </div>
                <pre><code>{currentQuestion.code_snippet}</code></pre>
              </div>
            )}
          </div>

          {/* Radio Options Group */}
          <fieldset
            role="radiogroup"
            aria-label="Question options"
            className="space-y-2.5"
          >
            <legend className="sr-only">Choose exactly one answer</legend>
            {currentQuestion.options.map((optText, optIdx) => {
              const isSelected = selectedOption === optIdx;
              const isCorrectOption = optIdx === currentQuestion.correct_index;

              let cardStyles =
                'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900';

              if (isAnswered) {
                if (isCorrectOption) {
                  cardStyles =
                    'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold ring-1 ring-emerald-500';
                } else if (isSelected && !isCorrectOption) {
                  cardStyles =
                    'border-rose-500 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500';
                } else {
                  cardStyles = 'opacity-50 border-slate-200 dark:border-slate-800';
                }
              } else if (isSelected) {
                cardStyles =
                  'border-cyan-500 bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500';
              }

              return (
                <label
                  key={optIdx}
                  htmlFor={`option-${optIdx}`}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left text-xs md:text-sm transition-all focus-within:ring-2 focus-within:ring-cyan-500 cursor-pointer ${cardStyles} ${
                    isAnswered || isSubmitting ? 'cursor-default' : ''
                  }`}
                >
                  <input
                    type="radio"
                    id={`option-${optIdx}`}
                    name="quiz-options"
                    value={optIdx}
                    checked={isSelected}
                    onChange={() => handleSelectOption(optIdx)}
                    disabled={isAnswered || isSubmitting}
                    className="mt-0.5 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <div className="flex-1 flex items-start gap-2">
                    <span className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-600 dark:text-slate-300">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{optText}</span>
                  </div>
                </label>
              );
            })}
          </fieldset>

          {/* Submit Action Guarded Against Double Clicks */}
          {!isAnswered ? (
            <div className="flex justify-end pt-2">
              <Button
                size="md"
                onClick={handleSubmitAttempt}
                disabled={selectedOption === null || isSubmitting}
                isLoading={isSubmitting}
                rightIcon={<ArrowRight size={16} />}
              >
                Submit Answer
              </Button>
            </div>
          ) : (
            /* Post-Submission Result Feedback */
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
              {/* Feedback: Correct / Not quite (Rule 4: icon + text) */}
              <div className="flex items-center justify-between">
                {selectedOption === currentQuestion.correct_index ? (
                  <div data-testid="feedback-status" className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span>Correct! Great job.</span>
                  </div>
                ) : (
                  <div data-testid="feedback-status" className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>Not quite.</span>
                  </div>
                )}

                {/* Concept Review Link */}
                <button
                  type="button"
                  onClick={() => setIsConceptModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer font-medium"
                >
                  <BookOpen size={13} />
                  <span>Concept Review</span>
                </button>
              </div>

              {/* Why the chosen option was wrong */}
              {selectedOption !== null && selectedOption !== currentQuestion.correct_index && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <div className="font-bold text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>
                      Why choice {String.fromCharCode(65 + selectedOption)} was wrong:
                    </span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed">
                    {Array.isArray(currentQuestion.wrong_reasons) &&
                    selectedOption !== null &&
                    currentQuestion.wrong_reasons[selectedOption]
                      ? currentQuestion.wrong_reasons[selectedOption]
                      : 'Common distractor trap violating the invariant.'}
                  </p>
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Pedagogical Explanation:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {currentQuestion.explanation}
                </p>
              </div>

              {/* Next Question / Finish Button */}
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={handleNextQuestion}
                  rightIcon={<ArrowRight size={14} />}
                >
                  {isLastQuestion ? 'Complete Quiz & View Score' : 'Next Question'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Concept Review Modal */}
      <Modal
        isOpen={isConceptModalOpen}
        onClose={() => setIsConceptModalOpen(false)}
        title={`Concept Review: ${currentTopic?.name || 'Topic Review'}`}
        description="Foundational principles and memory invariants to review before proceeding."
      >
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">
              Topic Scope
            </div>
            <p>{currentTopic?.description || 'Core syllabus concepts and execution semantics.'}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-200">Key Principles & Common Distractor Traps:</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Always verify memory address boundary conditions (&amp; vs *).</li>
              <li>Pointer arithmetic increments by <code>sizeof(type)</code> bytes, not 1 byte.</li>
              <li>In loops, carefully trace termination condition bounds (&lt; vs &lt;=).</li>
              <li>Linked lists require careful order of pointer reconnection to avoid node disconnection.</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setIsConceptModalOpen(false)}>
              Got it, continue practice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
