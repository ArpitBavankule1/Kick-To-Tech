import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Minus,
  Flame,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Play,
  History,
  Target,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import {
  studentService,
  type EnrolledSubjectItem,
} from '../../services/student.service';
import type { Topic, Assignment, DbQuestion, Attempt } from '../../types/database';
import {
  getTopicStats,
  getTrend,
  getStreak,
  getMistakePatterns,
  getRecentActivity,
  recommendNext,
} from '../../engine';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [todayAssignment, setTodayAssignment] = useState<Assignment | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [questions, setQuestions] = useState<DbQuestion[]>([]);

  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Add Subject Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subjectCodeInput, setSubjectCodeInput] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const studentId = user?.id || 'std-mock-1';
  const todayDate = new Date().toISOString().split('T')[0];

  // 1. Load enrolled subjects
  const loadEnrolledSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      const list = await studentService.getEnrolledSubjects(studentId);
      setEnrolledSubjects(list);
      if (list.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(list[0].subject_id);
      }
    } catch {
      error('Failed to load enrolled subjects.');
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [studentId, selectedSubjectId, error]);

  useEffect(() => {
    loadEnrolledSubjects();
  }, [loadEnrolledSubjects]);

  // 2. Load subject data (topics, assignments, attempts, questions) when subject changes
  const loadSubjectData = useCallback(async (subjectId: string) => {
    setIsLoadingData(true);
    try {
      const [topicsList, assignment, attemptsList] = await Promise.all([
        studentService.getSubjectTopics(subjectId),
        studentService.getTodayAssignment(subjectId, todayDate),
        studentService.getStudentSubjectAttempts(studentId, subjectId),
      ]);

      setTopics(topicsList);
      setTodayAssignment(assignment);
      setAttempts(attemptsList);

      // Fetch questions for recommendation & analysis
      const primaryTopicId = assignment?.topic_id || (topicsList.length > 0 ? topicsList[0].id : 'topic-pointers');
      const questionsList = await studentService.getAssignmentQuestions(
        assignment?.id || 'asgn-default',
        subjectId,
        primaryTopicId
      );
      setQuestions(questionsList);
    } catch {
      error('Error refreshing subject telemetry.');
    } finally {
      setIsLoadingData(false);
    }
  }, [studentId, todayDate, error]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadSubjectData(selectedSubjectId);
    }
  }, [selectedSubjectId, loadSubjectData]);

  // Handle Add Subject submission
  const handleEnrollSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = subjectCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setEnrollError('Please enter a valid subject code.');
      return;
    }

    setIsEnrolling(true);
    setEnrollError(null);

    const res = await studentService.enrollInSubject(studentId, cleanCode);
    setIsEnrolling(false);

    if (!res.success || !res.subject) {
      setEnrollError(res.error || 'Could not find a subject with that code.');
      return;
    }

    success(`Enrolled in ${res.subject.name} (${res.subject.code})!`);
    setIsAddModalOpen(false);
    setSubjectCodeInput('');
    await loadEnrolledSubjects();
    setSelectedSubjectId(res.subject.id);
  };

  // Currently active subject
  const currentSubject = useMemo(() => {
    return enrolledSubjects.find(s => s.subject_id === selectedSubjectId) || null;
  }, [enrolledSubjects, selectedSubjectId]);

  // Phase 4 Engine Derived Insights
  const topicStatsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getTopicStats>>();
    for (const topic of topics) {
      const topicAttempts = attempts.filter(
        a => a.topic_id === topic.id || (a as Record<string, unknown>).topic === topic.slug || (a as Record<string, unknown>).topic === topic.id
      );
      map.set(topic.id, getTopicStats(topicAttempts, topic.id));
    }
    return map;
  }, [topics, attempts]);

  const topicTrendsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getTrend>>();
    for (const topic of topics) {
      const topicAttempts = attempts.filter(
        a => a.topic_id === topic.id || (a as Record<string, unknown>).topic === topic.slug || (a as Record<string, unknown>).topic === topic.id
      );
      map.set(topic.id, getTrend(topicAttempts));
    }
    return map;
  }, [topics, attempts]);

  // RecommendationCard derivation
  const recommendation = useMemo(() => {
    return recommendNext(attempts, topics, questions);
  }, [attempts, topics, questions]);

  // Streak calculation (timezone safe)
  const streak = useMemo(() => {
    return getStreak(attempts);
  }, [attempts]);

  // Mistake patterns derivation (top 3 subskills by misses, min 2)
  const mistakePatterns = useMemo(() => {
    return getMistakePatterns(attempts, questions);
  }, [attempts, questions]);

  // Last 5 answers activity feed
  const recentActivities = useMemo(() => {
    return getRecentActivity(attempts, 5);
  }, [attempts]);

  // Check if today's assignment is completed
  const isAssignmentCompleted = useMemo(() => {
    if (!todayAssignment) return false;
    const assignmentAttempts = attempts.filter(a => a.assignment_id === todayAssignment.id);
    return assignmentAttempts.length >= 5;
  }, [todayAssignment, attempts]);

  // Empty state 1: No subjects joined
  if (!isLoadingSubjects && enrolledSubjects.length === 0) {
    return (
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <EmptyState
          icon={<BookOpen size={32} />}
          title="No Subjects Enrolled"
          description="You are not enrolled in any subjects yet. Enter the subject code provided by your teacher or department to start your learning journey."
          actionText="Add Subject with Code"
          onAction={() => setIsAddModalOpen(true)}
        />

        {/* Add Subject Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEnrollError(null);
            setSubjectCodeInput('');
          }}
          title="Join a Subject"
          description="Enter the unique subject code (e.g. CS101, DATA200) provided by your instructor."
        >
          <form onSubmit={handleEnrollSubject} className="space-y-4">
            <Input
              label="Subject Code"
              placeholder="e.g. CS101"
              value={subjectCodeInput}
              onChange={e => setSubjectCodeInput(e.target.value)}
              error={enrollError || undefined}
              required
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEnrollError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isEnrolling}>
                Join Subject
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Welcome back, {user?.full_name || 'Student'}
            </h1>
            <Badge variant="cyan" size="sm">Student</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Phase 4 Deterministic Engine • Derived Knowledge Map, Active Mastery & Recommendations.
          </p>
        </div>

        {/* Global Streak Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-xs">
            <Flame size={16} className="text-amber-500 fill-amber-500" />
            <span>{streak.currentStreak} Day Streak</span>
            {streak.maxStreak > streak.currentStreak && (
              <span className="text-[10px] text-amber-400/80 font-normal">
                (Best: {streak.maxStreak})
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Subject
          </Button>
        </div>
      </div>

      {/* Subject Separation: Tabs / Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Enrolled Subjects ({enrolledSubjects.length})
          </h2>
        </div>

        {isLoadingSubjects ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Skeleton height={50} />
            <Skeleton height={50} />
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {enrolledSubjects.map((sub) => {
              const isSelected = sub.subject_id === selectedSubjectId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.subject_id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left shrink-0 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <BookOpen size={18} className={isSelected ? 'text-cyan-500' : 'text-slate-400'} />
                  <div>
                    <div className="text-sm font-bold leading-tight">{sub.name}</div>
                    <div className="text-[11px] opacity-75">{sub.code}</div>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-cyan-500 hover:border-cyan-500 text-xs font-medium shrink-0 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Subject</span>
            </button>
          </div>
        )}
      </div>

      {isLoadingData ? (
        <div className="space-y-6">
          <Skeleton height={140} />
          <Skeleton height={200} />
          <Skeleton height={120} />
        </div>
      ) : (
        <>
          {/* 1. Today's Practice Card (Shown ONLY for published assignments) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Today's Assignment
              </h3>
              <span className="text-xs text-slate-400">Date: {todayDate}</span>
            </div>

            {todayAssignment && todayAssignment.status === 'published' ? (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                        <Calendar size={14} />
                        <span>Daily Practice Loop</span>
                      </span>
                      <Badge variant="cyan" size="sm">
                        {currentSubject?.code || 'CS Core'}
                      </Badge>
                      {isAssignmentCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <CheckCircle2 size={12} />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          <Clock size={12} />
                          <span>Not started</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                      {todayAssignment.title || 'Diagnostic Practice Session'}
                    </h2>

                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                      {todayAssignment.instructions ||
                        'Practice targeted questions designed to reinforce core principles and reveal misconception boundaries.'}
                    </p>
                  </div>

                  <Link to={`/student/quiz/${todayAssignment.id}`} className="shrink-0">
                    <Button
                      size="md"
                      variant={isAssignmentCompleted ? 'secondary' : 'primary'}
                      leftIcon={isAssignmentCompleted ? <CheckCircle2 size={16} /> : <Play size={16} />}
                    >
                      {isAssignmentCompleted ? 'Review Quiz' : 'Start Today\'s Practice'}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Empty state: No assignment today */
              <Card className="text-center py-8">
                <Clock size={28} className="mx-auto text-slate-400 mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  No Assignment Today
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                  Your instructor has not scheduled a published assignment for today. You can still practice using the recommended question below!
                </p>
              </Card>
            )}
          </div>

          {/* 2. Knowledge Gap Map of the Subject's Topics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Target size={18} className="text-cyan-500" />
                  <span>Knowledge Gap Map</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Derived mastery, attempts, confidence estimates, and performance trends per syllabus topic.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topics.map((topic) => {
                const stats = topicStatsMap.get(topic.id) || {
                  correct: 0,
                  total: 0,
                  mastery: null,
                  confidence: 'early',
                  status: 'not-assessed',
                };
                const trend = topicTrendsMap.get(topic.id);

                return (
                  <Card key={topic.id} hoverable className="flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                          {topic.name}
                        </h4>
                        <StatusBadge
                          status={stats.status}
                          accuracy={stats.mastery}
                          size="sm"
                        />
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {topic.description || 'Topic principles and computational invariants.'}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                      {/* Attempt Count & Confidence */}
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>Based on {stats.total} {stats.total === 1 ? 'attempt' : 'attempts'}</span>
                        {stats.total < 3 && stats.total > 0 && (
                          <Badge variant="amber" size="sm">
                            Early estimate (&lt;3)
                          </Badge>
                        )}
                        {stats.total === 0 && (
                          <span className="text-slate-400 text-[10px]">Unassessed</span>
                        )}
                      </div>

                      {/* Trend Arrow */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-400">Performance trend:</span>
                        {trend && trend.available ? (
                          trend.trend === 'improving' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                              <TrendingUp size={13} />
                              <span>Improving (+{trend.delta}%)</span>
                            </span>
                          ) : trend.trend === 'declining' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                              <TrendingDown size={13} />
                              <span>Declining ({trend.delta}%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-cyan-500">
                              <ArrowRight size={13} />
                              <span>Steady (±{Math.abs(trend.delta)}%)</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Minus size={13} />
                            <span>Needs 6 attempts</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 3. RecommendationCard & Mistake Patterns Row */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* RecommendationCard */}
            <div className="md:col-span-2">
              <Card className="h-full border-cyan-500/20 bg-gradient-to-br from-slate-900/60 to-slate-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-cyan-400" />
                      <h4 className="text-sm font-bold text-slate-100">
                        Adaptive Recommendation
                      </h4>
                    </div>
                    {recommendation.targetDifficulty && (
                      <Badge variant="cyan" size="sm">
                        Difficulty: {recommendation.targetDifficulty.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {recommendation.reason}
                  </p>

                  {recommendation.question && (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 mb-4 space-y-1.5">
                      <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                        Next Priority Question
                      </div>
                      <div className="font-medium text-slate-100">
                        {recommendation.question.question}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Link to={`/student/quiz/${todayAssignment?.id || 'adaptive'}`}>
                    <Button size="sm" rightIcon={<ArrowRight size={14} />}>
                      Practice Recommended Question
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Mistake Patterns */}
            <div>
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Mistake Patterns
                    </h4>
                  </div>

                  {mistakePatterns.length > 0 ? (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Top recurring subskill gaps (minimum 2 misses):
                      </p>
                      {mistakePatterns.map((pattern, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-amber-600 dark:text-amber-300">
                            {pattern.concept}
                          </span>
                          <Badge variant="amber" size="sm">
                            {pattern.misses} misses
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                      <ShieldCheck size={28} className="mx-auto text-emerald-500" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No Recurring Patterns
                      </p>
                      <p className="text-[11px]">
                        Fewer than 2 errors per subskill. Great precision on foundational invariants!
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* 4. Last 5 Answers Activity Feed */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Attempts (Last 5)
              </h3>
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-2">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {act.isCorrect ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-rose-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {act.isCorrect ? 'Correct submission' : 'Incorrect attempt'}
                        </span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          Topic: {act.topicId}
                        </span>
                      </div>
                    </div>

                    <span className="text-slate-400 text-[11px] shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="text-center py-6 text-xs text-slate-400">
                No recent attempts recorded yet for this subject. Complete today's assignment to start your telemetry history!
              </Card>
            )}
          </div>
        </>
      )}

      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEnrollError(null);
          setSubjectCodeInput('');
        }}
        title="Add Subject with Code"
        description="Enter the course subject code provided by your instructor (e.g. CS101, DATA200)."
      >
        <form onSubmit={handleEnrollSubject} className="space-y-4">
          <Input
            label="Subject Code"
            placeholder="e.g. CS101"
            value={subjectCodeInput}
            onChange={e => setSubjectCodeInput(e.target.value)}
            error={enrollError || undefined}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEnrollError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isEnrolling}>
              Join Subject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
