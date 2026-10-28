import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminSubjectsPage: React.FC = () => {
  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} />
        <span>Back to Admin Center</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Curriculum Subjects & Topics
            </h1>
            <Badge variant="cyan" size="sm">Schema Level</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define subjects and syllabus topics that teachers can assign daily.
          </p>
        </div>

        <Button size="sm" leftIcon={<Plus size={14} />}>
          Add New Subject
        </Button>
      </div>

      <div className="space-y-4">
        <Card
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-cyan-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  CS-101: Computer Science Core Fundamentals
                </h3>
              </div>
              <Badge variant="emerald" size="sm">Active Curriculum</Badge>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Core sequence covering memory architecture, iteration control structures, and fundamental pointer semantics.
            </p>

            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>1. Arrays & Memory Contiguity</span>
                <span className="text-slate-400 font-mono">5 questions</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>2. Loops & Control Invariants</span>
                <span className="text-slate-400 font-mono">5 questions</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>3. Pointers & Memory Dereference</span>
                <span className="text-slate-400 font-mono">5 questions</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>4. Basic Data Structures</span>
                <span className="text-slate-400 font-mono">5 questions</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
