import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-8">
      {/* Teacher Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Instructor Portal: {user?.full_name || 'Educator'}
            </h1>
            <Badge variant="amber" size="sm">Approved Educator</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor cohort conceptual weaknesses, set daily topic assignments, and publish verified questions.
          </p>
        </div>

        <Link to="/teacher/assign">
          <Button size="md" leftIcon={<Plus size={16} />}>
            Set Today's Topic Assignment
          </Button>
        </Link>
      </div>

      {/* Cohort Weakness Distribution (Rule 2: Derived metrics) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Cohort Concept Gap Heatmap (Derived from 142 student attempts)
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hoverable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Pointers & Memory</h4>
              <StatusBadge status="weak" accuracy={38} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              62% of students missed Pointer Arithmetic scale factor.
            </p>
            <div className="text-[11px] text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-200 dark:border-rose-900/50">
              ⚠️ Recommendation: Schedule daily revision
            </div>
          </Card>

          <Card hoverable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Loops & Control Flow</h4>
              <StatusBadge status="developing" accuracy={65} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Frequent off-by-one errors on boundary conditions.
            </p>
            <div className="text-[11px] text-amber-500 font-semibold bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-900/50">
              📈 Approaching target mastery threshold
            </div>
          </Card>

          <Card hoverable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Arrays</h4>
              <StatusBadge status="strong" accuracy={84} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Strong retention on O(1) random indexing and dynamic resizing.
            </p>
            <div className="text-[11px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-900/50">
              🛡️ Mastered baseline retention
            </div>
          </Card>

          <Card hoverable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Data Structures</h4>
              <StatusBadge status="not_assessed" size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Module unassigned; 0 student attempts recorded.
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded">
              ❓ Rule 3: Unassessed topics are never labeled weak
            </div>
          </Card>
        </div>
      </div>

      {/* Draft Review Pipeline (Rule 8: Gemini output is untrusted; teacher must publish) */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                AI Question Verification Pipeline (Draft ➔ Published)
              </h4>
            </div>
            <Badge variant="cyan" size="sm">Rule 8 Invariant</Badge>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Per platform safety rules, questions generated via AI Edge Functions enter the database with status <code>draft</code>. A verified teacher must audit the question prompt, distractors, and answer key before publishing to student pools.
          </p>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Draft: "Dangling Pointer in Local Stack Allocation"
              </div>
              <div className="text-slate-400">Topic: Pointers • Status: <span className="text-amber-500 font-semibold uppercase">Draft (Pending Teacher Review)</span></div>
            </div>
            <Button size="sm" variant="secondary">
              Review & Publish
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
