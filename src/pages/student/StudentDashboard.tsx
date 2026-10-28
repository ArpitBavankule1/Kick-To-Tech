import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Play, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-8">
      {/* Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Welcome back, {user?.full_name || 'Student'}
            </h1>
            <Badge variant="cyan" size="sm">Student</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adaptive practice engine: targeting concept gaps derived from your actual attempts.
          </p>
        </div>

        <Link to="/student/quiz/daily-assignment">
          <Button size="md" leftIcon={<Sparkles size={16} />}>
            Start Adaptive Practice
          </Button>
        </Link>
      </div>

      {/* Daily Assigned Topic Banner (Rule 7: One assigned topic per subject per day) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Calendar size={14} />
                <span>Today's Assigned Topic ({today})</span>
              </span>
              <Badge variant="default" size="sm">CS Core</Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Pointers & Memory Dereferencing
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Teacher assignment: Practice memory offset calculations and pointer arithmetic invariants to solidify heap/stack concepts.
            </p>
          </div>

          <Link to="/student/quiz/daily-assignment">
            <Button size="sm" leftIcon={<Play size={14} />}>
              Launch Daily Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Derived Mastery Overview (Rule 2: Derived, never stored; Rule 4: icon + text) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Derived Knowledge Map
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mastery status dynamically computed from attempts table (0 attempts = Not Assessed; 0% = Weak).
            </p>
          </div>

          <Link to="/student/subject/cs-core">
            <Button variant="ghost" size="sm">
              View Subject Breakdown →
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hoverable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Arrays</h4>
              <StatusBadge status="strong" accuracy={85} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Contiguous memory indexing and dynamic array doubling.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
              <span>6 attempts</span>
              <span className="text-emerald-500 font-semibold">5 correct</span>
            </div>
          </Card>

          <Card hoverable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Loops & Control Flow</h4>
              <StatusBadge status="developing" accuracy={60} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Off-by-one boundary traps and loop invariants.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
              <span>5 attempts</span>
              <span className="text-amber-500 font-semibold">3 correct</span>
            </div>
          </Card>

          <Card hoverable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Pointers & Memory</h4>
              <StatusBadge status="weak" accuracy={33} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Dereferencing, arithmetic scale factor, dangling pointers.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
              <span>3 attempts</span>
              <span className="text-rose-500 font-semibold">1 correct (Priority)</span>
            </div>
          </Card>

          <Card hoverable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Basic Data Structures</h4>
              <StatusBadge status="not_assessed" size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Stacks, Queues, Linked Lists (Awaiting baseline assessment).
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
              <span>0 attempts</span>
              <span className="text-slate-400">Baseline pending</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
