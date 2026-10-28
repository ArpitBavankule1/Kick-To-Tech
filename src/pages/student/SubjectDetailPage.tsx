import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';

export const SubjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-6">
      <Link to="/student" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} />
        <span>Back to Student Dashboard</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Computer Science Core Fundamentals
            </h1>
            <Badge variant="cyan" size="sm">ID: {id || 'cs-core'}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Course curriculum: 4 foundational modules with adaptive diagnostic practice.
          </p>
        </div>

        <Link to="/student/quiz/adaptive-practice">
          <Button size="sm" leftIcon={<Play size={14} />}>
            Adaptive Practice Loop
          </Button>
        </Link>
      </div>

      {/* Topics list */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Curriculum Topics & Derived Mastery
        </h3>

        {[
          {
            title: 'Arrays & Contiguous Memory',
            desc: 'Random access O(1), element shifting costs, memory offset calculations, dynamic array amortized doubling.',
            status: 'strong' as const,
            accuracy: 85,
            attempts: 6,
          },
          {
            title: 'Loops & Control Flow',
            desc: 'Boundary conditions (< vs <=), post-decrement while loop tracing, nested loop asymptotic complexity O(N^2).',
            status: 'developing' as const,
            accuracy: 60,
            attempts: 5,
          },
          {
            title: 'Pointers & Memory Architecture',
            desc: 'Address-of operator &, dereference *, pointer arithmetic sizeof scaling, dangling pointer hazards.',
            status: 'weak' as const,
            accuracy: 33,
            attempts: 3,
          },
          {
            title: 'Basic Data Structures',
            desc: 'Stack LIFO vs Queue FIFO principles, head insertion in linked lists vs arrays, parentheses matching algorithm.',
            status: 'not_assessed' as const,
            accuracy: null,
            attempts: 0,
          },
        ].map((topic, idx) => (
          <Card key={idx}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{topic.title}</h4>
                  <StatusBadge status={topic.status} accuracy={topic.accuracy} size="sm" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">{topic.desc}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400">
                  {topic.attempts} attempts
                </span>
                <Link to="/student/quiz/direct-practice">
                  <Button variant="secondary" size="sm">
                    {topic.attempts === 0 ? 'Assess' : 'Practice'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
