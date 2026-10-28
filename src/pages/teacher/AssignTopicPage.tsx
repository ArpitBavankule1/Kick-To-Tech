import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Send,
  HelpCircle,
  Code2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import {
  teacherService,
  type TeacherSubjectInfo,
} from '../../services/teacher.service';
import type { NormalizedQuestion } from '../../engine/quizValidator';
import type { Assignment } from '../../types/database';

export const AssignTopicPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, warning } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const [subjectInfo, setSubjectInfo] = useState<TeacherSubjectInfo | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [assignedDate, setAssignedDate] = useState(today);
  const [existingAssignment, setExistingAssignment] = useState<Assignment | null>(null);
  const [isLoadingSubject, setIsLoadingSubject] = useState(true);

  // Generation & Preview State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedAssignmentId, setGeneratedAssignmentId] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<NormalizedQuestion[] | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load Teacher's Subject and Syllabus Topics
  const loadTeacherSubject = useCallback(async () => {
    setIsLoadingSubject(true);
    try {
      const info = await teacherService.getTeacherSubject(user?.id);
      setSubjectInfo(info);
      if (info.topics.length > 0) {
        setSelectedTopicId(info.topics[0].id);
      }

      // Check if date already has an assignment
      const existing = await teacherService.getTodayAssignment(info.subject.id, assignedDate);
      setExistingAssignment(existing);
    } catch (err) {
      toastError('Subject Error', err instanceof Error ? err.message : 'Failed to load subject information.');
    } finally {
      setIsLoadingSubject(false);
    }
  }, [user?.id, assignedDate, toastError]);

  useEffect(() => {
    loadTeacherSubject();
  }, [loadTeacherSubject]);

  // Check assignment when date changes
  const handleDateChange = async (newDate: string) => {
    setAssignedDate(newDate);
    if (!subjectInfo) return;
    try {
      const existing = await teacherService.getTodayAssignment(subjectInfo.subject.id, newDate);
      setExistingAssignment(existing);
    } catch {
      // ignore
    }
  };

  // Generate Questions via AI Edge Function / Fallback
  const handleGenerateQuestions = async () => {
    if (!subjectInfo || !selectedTopicId) return;

    if (existingAssignment && existingAssignment.status === 'published') {
      warning(
        'Rule 7 Conflict',
        `A topic is already published for ${assignedDate}. Only one topic per subject per day is permitted.`
      );
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await teacherService.generateQuizQuestions({
        subjectId: subjectInfo.subject.id,
        topicId: selectedTopicId,
        assignedDate,
        teacherId: user?.id || 'teacher-mock-1',
      });

      if (result.success && result.questions) {
        setPreviewQuestions(result.questions);
        setGeneratedAssignmentId(result.assignmentId || null);
        success('Quiz Generated!', '5 questions created (2 easy, 2 medium, 1 hard). Review and publish when ready.');
      } else {
        const msg = result.error || 'Failed to generate quiz questions.';
        setGenerationError(msg);
        toastError('Generation Failed', msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown generation error';
      setGenerationError(msg);
      toastError('Generation Error', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish Assignment Action
  const handlePublishAssignment = async () => {
    if (!subjectInfo || !selectedTopicId) return;

    setIsPublishing(true);
    try {
      const assignmentId = generatedAssignmentId || `asgn-${subjectInfo.subject.id}-${assignedDate}`;
      const result = await teacherService.publishAssignment({
        assignmentId,
        subjectId: subjectInfo.subject.id,
        topicId: selectedTopicId,
        assignedDate,
      });

      if (result.success) {
        const topicName = subjectInfo.topics.find((t) => t.id === selectedTopicId)?.name || 'Daily Focus';
        success(
          'Assignment Published!',
          `Students can now practice the 5 targeted questions for ${topicName}.`
        );
        navigate('/teacher');
      } else {
        toastError('Publish Failed', result.error || 'Could not publish assignment.');
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to publish.');
    } finally {
      setIsPublishing(false);
    }
  };

  const subject = subjectInfo?.subject;
  const topics = subjectInfo?.topics || [];
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const isPublishedForDate = existingAssignment && existingAssignment.status === 'published';

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Navigation Link */}
      <div className="flex items-center gap-2">
        <Link
          to="/teacher"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Teacher Dashboard</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Schedule Daily Topic Assignment
          </h1>
          {subject && (
            <Badge variant="cyan" size="sm">
              <BookOpen size={12} />
              <span>{subject.code}</span>
            </Badge>
          )}
          <Badge variant="amber" size="sm">
            <span>Rule 7 Enforced</span>
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Course: <span className="font-semibold text-slate-700 dark:text-slate-300">{subject?.name || 'Assigned Subject'}</span> • Generate AI-crafted multiple choice questions, review distractors, and publish to students.
        </p>
      </div>

      {/* Block friendly warning if already published for selected date */}
      {isPublishedForDate && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm">
              Topic Already Assigned for {assignedDate}
            </span>
            <p className="leading-relaxed">
              A published assignment (<strong>{existingAssignment.title}</strong>) is already active for this date.
              Platform <strong>Rule 7</strong> strictly enforces <em>one assigned topic per subject per day</em> to ensure focused student retention and avoid cognitive fatigue.
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-0.5">
              To schedule questions for another day, select a future date below.
            </p>
          </div>
        </div>
      )}

      {/* Configuration Card: Topic Picker & Date */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-cyan-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              1. Topic Selection & Schedule
            </h2>
          </div>
        }
      >
        {isLoadingSubject ? (
          <div className="space-y-3 p-2">
            <Skeleton height={36} className="w-full" />
            <Skeleton height={36} className="w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Topic picker: filtered to their subject's topics only */}
              <Select
                id="topic-picker"
                label="Course Topic (Syllabus Only)"
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                options={
                  topics.length > 0
                    ? topics.map((t) => ({
                        value: t.id,
                        label: `${t.name} (Topic #${t.order_index})`,
                      }))
                    : [{ value: '', label: 'No topics found for this subject' }]
                }
                disabled={topics.length === 0}
              />

              <Input
                id="assigned-date"
                label="Scheduled Calendar Date"
                type="date"
                value={assignedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                helperText="Enforces UNIQUE(subject_id, assigned_date)"
              />
            </div>

            {selectedTopic && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Topic Focus: {selectedTopic.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {selectedTopic.description}
                </div>
              </div>
            )}

            {/* Error Banner if generation failed */}
            {generationError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{generationError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                AI will generate 5 questions: 2 easy, 2 medium, 1 hard.
              </span>

              <Button
                size="md"
                variant="primary"
                leftIcon={<Sparkles size={16} />}
                onClick={handleGenerateQuestions}
                isLoading={isGenerating}
                disabled={isPublishedForDate || !selectedTopicId}
              >
                {previewQuestions ? 'Regenerate Questions' : 'Generate Quiz with AI'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 2. Questions Preview Section */}
      {previewQuestions && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  2. Question Review & Distractor Audit
                </h2>
                <Badge variant="cyan" size="sm">
                  <span>Rule 8: Teacher Must Publish</span>
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review the generated answer key and pedagogical wrong-answer explanations before publishing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<RotateCcw size={14} />}
                onClick={handleGenerateQuestions}
                disabled={isGenerating || isPublishing}
              >
                Regenerate
              </Button>

              <Button
                size="sm"
                variant="primary"
                leftIcon={<Send size={14} />}
                onClick={handlePublishAssignment}
                isLoading={isPublishing}
              >
                Publish Daily Assignment
              </Button>
            </div>
          </div>

          {/* Render 5 Questions */}
          <div className="space-y-4">
            {previewQuestions.map((q, qIndex) => (
              <Card key={qIndex} className="space-y-3.5">
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <Badge
                      variant={
                        q.difficulty === 'easy'
                          ? 'emerald'
                          : q.difficulty === 'medium'
                          ? 'amber'
                          : 'rose'
                      }
                      size="sm"
                    >
                      <span className="capitalize">{q.difficulty}</span>
                    </Badge>
                    <Badge variant="slate" size="sm">
                      <span>{q.subskill}</span>
                    </Badge>
                  </div>

                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Option #{q.correct_index + 1} is verified correct</span>
                  </span>
                </div>

                {/* Prompt Text */}
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {q.prompt}
                </div>

                {/* Optional C Code Snippet */}
                {q.code_snippet && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 p-3.5 font-mono text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">
                      <Code2 size={12} />
                      <span>C Source Code</span>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre font-mono text-cyan-300">
                      <code>{q.code_snippet}</code>
                    </pre>
                  </div>
                )}

                {/* 4 Options with Distractor Explanations */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Options & Distractor Analysis:
                  </div>

                  <div className="grid gap-2">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = optIndex === q.correct_index;
                      const wrongReason = q.wrong_reasons[optIndex];

                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-xl border transition-all text-xs ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 shadow-xs'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span className="font-semibold">{opt}</span>
                            </div>

                            {isCorrect && (
                              <Badge variant="emerald" size="sm">
                                <Check size={11} />
                                <span>Correct Answer</span>
                              </Badge>
                            )}
                          </div>

                          {/* Pedagogical Wrong Reason */}
                          {!isCorrect && wrongReason && (
                            <div className="mt-2 ml-7 p-2 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] border border-amber-500/20 flex items-start gap-1.5">
                              <HelpCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                              <span>
                                <strong>Misconception Trap:</strong> {wrongReason}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Pedagogical Explanation:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar size={14} className="text-cyan-500" />
              <span>
                Publishing for: <strong>{assignedDate}</strong> ({selectedTopic?.name})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<RotateCcw size={14} />}
                onClick={handleGenerateQuestions}
                disabled={isGenerating || isPublishing}
              >
                Regenerate
              </Button>

              <Button
                size="md"
                variant="primary"
                leftIcon={<Send size={15} />}
                onClick={handlePublishAssignment}
                isLoading={isPublishing}
              >
                Publish Daily Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
