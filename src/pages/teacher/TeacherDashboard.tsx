import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import {
  teacherService,
  type TeacherSubjectInfo,
  type ClassOverviewMetrics,
} from '../../services/teacher.service';
import type { Assignment } from '../../types/database';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const todayDate = new Date().toISOString().split('T')[0];

  const [subjectInfo, setSubjectInfo] = useState<TeacherSubjectInfo | null>(null);
  const [todayAssignment, setTodayAssignment] = useState<Assignment | null>(null);
  const [classOverview, setClassOverview] = useState<ClassOverviewMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const info = await teacherService.getTeacherSubject(user?.id);
      setSubjectInfo(info);

      const [assignment, overview] = await Promise.all([
        teacherService.getTodayAssignment(info.subject.id, todayDate),
        teacherService.getClassOverview(info.subject.id, todayDate),
      ]);

      setTodayAssignment(assignment);
      setClassOverview(overview);
    } catch (err) {
      toastError('Dashboard Error', err instanceof Error ? err.message : 'Failed to load teacher metrics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, todayDate, toastError]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const subject = subjectInfo?.subject;
  const topics = subjectInfo?.topics || [];
  const assignedTopic = topics.find((t) => t.id === todayAssignment?.topic_id);

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* 1. Header: Subject Name and Code */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {subject ? `${subject.name}` : 'Course Subject'}
            </h1>
            {subject && (
              <Badge variant="cyan" size="md">
                <BookOpen size={12} />
                <span>{subject.code}</span>
              </Badge>
            )}
            <Badge variant="amber" size="sm">
              <CheckCircle2 size={12} />
              <span>Verified Educator</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instructor: <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.full_name || 'Faculty'}</span> • Daily adaptive curriculum authoring & student cohort mastery diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Refresh
          </Button>

          <Link to="/teacher/assign">
            <Button size="sm" variant="primary" leftIcon={<Plus size={14} />}>
              {todayAssignment ? 'Manage Today\'s Topic' : 'Assign Today\'s Topic'}
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Today's Assignment Card */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-cyan-500" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Today's Daily Topic Assignment ({new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })})
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Rule 7: One topic per subject per day
            </span>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton height={28} className="w-1/3" />
            <Skeleton height={18} className="w-2/3" />
          </div>
        ) : todayAssignment ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {assignedTopic?.name || todayAssignment.title}
                </span>
                <Badge
                  variant={todayAssignment.status === 'published' ? 'emerald' : 'amber'}
                  size="sm"
                >
                  {todayAssignment.status === 'published' ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  <span className="capitalize">{todayAssignment.status}</span>
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {todayAssignment.instructions || 'Review key concepts and complete the 5 adaptive questions.'}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                <span>Course: {subject?.code}</span>
                <span>•</span>
                <span>Date: {todayAssignment.assigned_date}</span>
                <span>•</span>
                <span>5 Verified MCQs</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/teacher/assign">
                <Button size="sm" variant="outline" rightIcon={<ArrowRight size={14} />}>
                  {todayAssignment.status === 'published' ? 'View Assignment' : 'Review & Publish Draft'}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <Clock size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    Not Assigned for Today
                  </h3>
                  <Badge variant="amber" size="sm">
                    <span>Action Required</span>
                  </Badge>
                </div>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Your students currently have no active topic scheduled for today. Generate a 5-question targeted quiz to guide their revision.
                </p>
              </div>
            </div>

            <Link to="/teacher/assign" className="shrink-0">
              <Button size="sm" variant="primary" leftIcon={<Sparkles size={14} />}>
                Generate Today's Quiz
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* 3. Class Overview Metrics */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Class Cohort Mastery Overview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Derived dynamically from student attempts. Zero attempts = Not Assessed; 0% with attempts = Weak.
            </p>
          </div>

          {classOverview && (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>
                  {classOverview.completedTodayCount} of {classOverview.totalEnrolledStudents} completed today's quiz
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Per-Topic Average Mastery Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton height={20} className="w-1/2 mb-2" />
                <Skeleton height={32} className="w-1/3 mb-2" />
                <Skeleton height={14} className="w-full" />
              </Card>
            ))
          ) : classOverview?.topicSummaries && classOverview.topicSummaries.length > 0 ? (
            classOverview.topicSummaries.map((summary) => (
              <Card key={summary.topicId} hoverable className="relative overflow-hidden">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {summary.topicName}
                  </h3>
                  <StatusBadge
                    status={summary.status}
                    accuracy={summary.averageMastery ?? undefined}
                    size="sm"
                  />
                </div>

                <div className="my-2">
                  {summary.averageMastery !== null ? (
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {summary.averageMastery}%
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-slate-400">
                      Not Assessed
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{summary.attemptsCount} attempts recorded</span>
                  {summary.status === 'weak' && (
                    <span className="text-rose-500 font-bold">Needs Revision</span>
                  )}
                  {summary.status === 'strong' && (
                    <span className="text-emerald-500 font-bold">Retained</span>
                  )}
                </p>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={<BookOpen size={32} />}
                title="No Topic Attempts Yet"
                description="Assign topics to begin recording student mastery metrics."
              />
            </div>
          )}
        </div>

        {/* 4. Struggling Students List */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown size={16} className="text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Struggling Students & Conceptual Bottlenecks
                </h3>
              </div>
              <Badge variant="rose" size="sm">
                <span>Adaptive Intervention Priority</span>
              </Badge>
            </div>
          }
        >
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton height={40} className="w-full" />
              <Skeleton height={40} className="w-full" />
            </div>
          ) : classOverview?.strugglingStudents && classOverview.strugglingStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Struggling Topic</th>
                    <th className="py-3 px-4">Mastery Rate</th>
                    <th className="py-3 px-4">Observed Misconception Trap</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {classOverview.strugglingStudents.map((stud) => (
                    <tr
                      key={stud.studentId}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                            <Users size={15} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {stud.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {stud.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {stud.weakTopicName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-rose-500">
                          {stud.masteryPercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                          <span>{stud.missedSubskill}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status="weak" size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 size={32} />}
              title="No Struggling Students Detected"
              description="All students assessed so far meet or exceed foundational mastery thresholds."
            />
          )}
        </Card>
      </div>
    </div>
  );
};
