import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export const AssignTopicPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, warning } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [subjectId, setSubjectId] = useState('cs-core');
  const [topicId, setTopicId] = useState('pointers');
  const [assignedDate, setAssignedDate] = useState(today);
  const [title, setTitle] = useState("Today's Daily Topic: Pointers & Memory");
  const [instructions, setInstructions] = useState('Complete the 5 targeted practice questions to solidify your conceptual grasp.');

  // Simulated existing assignments to demonstrate the unique constraint
  const [existingAssignments] = useState<string[]>([
    // `cs-core-${today}` is simulated as pending
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignmentKey = `${subjectId}-${assignedDate}`;

    if (existingAssignments.includes(assignmentKey)) {
      warning(
        'Database Constraint Violation',
        'Rule 7 Violation: Only one topic can be assigned per subject per day.'
      );
      return;
    }

    success('Assignment Published!', `Successfully scheduled ${title} for ${assignedDate}.`);
    navigate('/teacher');
  };

  return (
    <div className="py-8 px-4 max-w-3xl mx-auto space-y-6">
      <Link to="/teacher" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} />
        <span>Back to Teacher Dashboard</span>
      </Link>

      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Publish Daily Topic Assignment
          </h1>
          <Badge variant="cyan" size="sm">Rule 7 Enforced</Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enforce focused daily mastery. The database strictly enforces <strong>one assigned topic per subject per day</strong>.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={[
                { value: 'cs-core', label: 'Computer Science Core (CS-101)' },
                { value: 'algo-core', label: 'Algorithms & Complexity (CS-201)' },
              ]}
            />

            <Select
              label="Target Topic (To Focus On)"
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value);
                setTitle(`Daily Focus: ${e.target.options[e.target.selectedIndex].text}`);
              }}
              options={[
                { value: 'pointers', label: 'Pointers & Memory Architecture' },
                { value: 'loops', label: 'Loops & Control Flow' },
                { value: 'arrays', label: 'Arrays & Contiguous Buffers' },
                { value: 'data_structures', label: 'Basic Data Structures (Stacks/Queues)' },
              ]}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Scheduled Date"
              type="date"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              required
              helperText="Constraint: UNIQUE(subject_id, assigned_date)"
            />

            <Input
              label="Assignment Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Student Instructions
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-cyan-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Rule 7 Architectural Guard:
              </span>
              <p>
                Postgres schema ensures no two topics can be assigned for the same subject on the same calendar day, preventing cognitive overload.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="md">
              Publish Daily Assignment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
