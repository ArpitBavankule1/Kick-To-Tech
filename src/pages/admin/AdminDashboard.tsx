import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  ArrowRight,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { adminService, type AdminOverviewCounts } from '../../services/admin.service';

export const AdminDashboard: React.FC = () => {
  const { error: toastError } = useToast();
  const [counts, setCounts] = useState<AdminOverviewCounts>({
    studentsCount: 0,
    teachersCount: 0,
    subjectsCount: 0,
    attemptsTodayCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCounts = async () => {
    try {
      const data = await adminService.getOverviewCounts();
      setCounts(data);
    } catch (err) {
      toastError('Failed to load metric counts', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCounts();
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Platform Administration Center
            </h1>
            <Badge variant="cyan" size="sm">
              <Shield size={12} />
              <span>Root Governance</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Database-level authorization gatekeeper. Admins are strictly seeded into Postgres migrations.
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
            Refresh Metrics
          </Button>
          <Link to="/admin/users">
            <Button size="sm" variant="secondary" leftIcon={<Users size={14} />}>
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/subjects">
            <Button size="sm" leftIcon={<BookOpen size={14} />}>
              Curriculum
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Students Count */}
        <Card hoverable className="relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Enrolled Students</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Users size={18} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton height={32} className="w-16 my-1" />
          ) : (
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {counts.studentsCount}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>Active student profiles</span>
          </div>
        </Card>

        {/* 2. Teachers Count */}
        <Card hoverable className="relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Faculty Teachers</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <GraduationCap size={18} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton height={32} className="w-16 my-1" />
          ) : (
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {counts.teachersCount}
            </div>
          )}
          <div className="text-[11px] text-amber-500 mt-2 flex items-center gap-1.5 font-medium">
            <Clock size={12} />
            <span>Requires administrative verification</span>
          </div>
        </Card>

        {/* 3. Subjects Count */}
        <Card hoverable className="relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Curriculum Subjects</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <BookOpen size={18} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton height={32} className="w-16 my-1" />
          ) : (
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {counts.subjectsCount}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-400" />
            <span>Syllabus modules with daily topics</span>
          </div>
        </Card>

        {/* 4. Attempts Today */}
        <Card hoverable className="relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Attempts Today</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity size={18} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton height={32} className="w-16 my-1" />
          ) : (
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {counts.attemptsTodayCount}
            </div>
          )}
          <div className="text-[11px] text-emerald-500 mt-2 flex items-center gap-1.5 font-medium">
            <Activity size={12} />
            <span>Server-side verified attempts</span>
          </div>
        </Card>
      </div>

      {/* Navigation Quick Launcher Hub */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card hoverable className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  User Management & Approvals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Filter students and educators
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Search profiles, approve pending educator registrations, suspend accounts, and manage system access.
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <Link to="/admin/users">
              <Button size="sm" variant="outline" className="w-full justify-between" rightIcon={<ArrowRight size={14} />}>
                Review Users Table
              </Button>
            </Link>
          </div>
        </Card>

        <Card hoverable className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Subjects & Topics Syllabus
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Curriculum catalog manager
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Create subjects with automatic course code generation, manage sub-topics, ordering indexes, and syllabus descriptions.
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <Link to="/admin/subjects">
              <Button size="sm" variant="outline" className="w-full justify-between" rightIcon={<ArrowRight size={14} />}>
                Manage Curriculum
              </Button>
            </Link>
          </div>
        </Card>

        <Card hoverable className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <LinkIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Faculty & Enrollment Mapping
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage teaching & student links
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Assign verified teachers to course subjects, audit student enrollments, and remove expired cohort links.
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <Link to="/admin/mapping">
              <Button size="sm" variant="outline" className="w-full justify-between" rightIcon={<ArrowRight size={14} />}>
                Configure Mappings
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Security & RLS Compliance Card */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Postgres Row-Level Security (RLS) Status
              </h3>
            </div>
            <Badge variant="emerald" size="sm">Active Policies Enforced</Badge>
          </div>
        }
      >
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            Database tables (<code>profiles</code>, <code>subjects</code>, <code>topics</code>, <code>teacher_subjects</code>, <code>enrollments</code>, <code>assignments</code>, <code>questions</code>, <code>attempts</code>, <code>contact_messages</code>) are protected by cryptographic JWT policies.
          </p>
          <div className="grid sm:grid-cols-3 gap-2 pt-2">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">Student Isolation</div>
              <div>Attempts & unassigned courses strictly blocked via RLS.</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">Teacher Boundary</div>
              <div>Educators only author & inspect their assigned subjects.</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">Answer Shielding</div>
              <div><code>correct_index</code> hidden from client network payloads.</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
