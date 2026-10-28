import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminDashboard: React.FC = () => {

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Platform Administration Center
            </h1>
            <Badge variant="cyan" size="sm">Seeded Super Admin</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rule Invariant: Admins are seeded into database migrations, never self-registered via public forms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/users">
            <Button size="sm" variant="secondary" leftIcon={<Users size={14} />}>
              Review Teacher Approvals
            </Button>
          </Link>
          <Link to="/admin/subjects">
            <Button size="sm" leftIcon={<BookOpen size={14} />}>
              Manage Subjects
            </Button>
          </Link>
        </div>
      </div>

      {/* Admin KPI Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pending Teacher Approvals</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">1</div>
          <div className="text-[11px] text-amber-500 mt-1 font-semibold">
            Action required: Jane Doe pending review
          </div>
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active Student Cohort</span>
            <Users size={16} className="text-cyan-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">48</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Self-registered via Supabase Auth
          </div>
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Verified Question Pool</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">20</div>
          <div className="text-[11px] text-emerald-500 mt-1">
            Published across 4 topics
          </div>
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Row-Level Security (RLS)</span>
            <Shield size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-500">6 / 6</div>
          <div className="text-[11px] text-slate-400 mt-1">
            100% of tables RLS-protected
          </div>
        </Card>
      </div>
    </div>
  );
};
