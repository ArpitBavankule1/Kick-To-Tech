import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Minus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import type { Topic, Attempt } from '../../types/database';
import { getTopicStats, getTrend } from '../../engine';

export const SubjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const studentId = user?.id || 'std-mock-1';
  const subjectId = id || 'subj-cs101';

  const [isLoading, setIsLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [topicsList, attemptsList] = await Promise.all([
          studentService.getSubjectTopics(subjectId),
          studentService.getStudentSubjectAttempts(studentId, subjectId),
        ]);
        if (isMounted) {
          setTopics(topicsList);
          setAttempts(attemptsList);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [subjectId, studentId]);

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-6">
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft size={14} />
        <span>Back to Student Dashboard</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Curriculum & Mastery Breakdown
            </h1>
            <Badge variant="cyan" size="sm">
              Subject ID: {subjectId}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Syllabus topics with real-time derived mastery, attempt counts, and performance trends.
          </p>
        </div>

        <Link to="/student/quiz/daily-assignment">
          <Button size="sm" leftIcon={<Play size={14} />}>
            Start Practice
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton height={80} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Topic Telemetry ({topics.length})
          </h3>

          {topics.map((topic) => {
            const topicAttempts = attempts.filter(
              (a) => a.topic_id === topic.id || (a as Record<string, unknown>).topic === topic.slug || (a as Record<string, unknown>).topic === topic.id
            );
            const stats = getTopicStats(topicAttempts, topic.id);
            const trend = getTrend(topicAttempts);

            return (
              <Card key={topic.id} hoverable>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {topic.name}
                      </h4>
                      <StatusBadge
                        status={stats.status}
                        accuracy={stats.mastery}
                        size="sm"
                      />
                      {stats.total < 3 && stats.total > 0 && (
                        <Badge variant="amber" size="sm">
                          Early estimate (&lt;3)
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {topic.description || 'Core concepts and computational rules.'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Based on {stats.total} attempts ({stats.correct} correct)</span>
                      <span>•</span>
                      {trend.available ? (
                        trend.trend === 'improving' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                            <TrendingUp size={12} />
                            <span>Improving (+{trend.delta}%)</span>
                          </span>
                        ) : trend.trend === 'declining' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                            <TrendingDown size={12} />
                            <span>Declining ({trend.delta}%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-cyan-500">
                            <ArrowRight size={12} />
                            <span>Steady (±{Math.abs(trend.delta)}%)</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Minus size={12} />
                          <span>Trend requires 6 attempts ({topicAttempts.length}/6)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link to="/student/quiz/daily-assignment">
                      <Button variant="secondary" size="sm">
                        Practice Topic
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
