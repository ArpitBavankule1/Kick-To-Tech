import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ShieldAlert, GraduationCap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

interface TeacherRequest {
  id: string;
  name: string;
  email: string;
  school: string;
  requestedAt: string;
  isApproved: boolean;
}

export const AdminUsersPage: React.FC = () => {
  const { success, info } = useToast();
  const [teachers, setTeachers] = useState<TeacherRequest[]>([
    {
      id: 'teacher-1',
      name: 'Prof. Jane Doe',
      email: 'jane.doe@university.edu',
      school: 'Dept of Computer Science',
      requestedAt: '2026-10-28 09:30 AM',
      isApproved: false,
    },
    {
      id: 'teacher-2',
      name: 'Dr. Sarah Lin',
      email: 'sarah.lin@college.edu',
      school: 'School of Computing',
      requestedAt: '2026-10-25 14:15 PM',
      isApproved: true,
    },
  ]);

  const handleApprove = (id: string, name: string) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isApproved: true } : t))
    );
    success('Teacher Approved!', `${name} now has authoring and publishing permissions.`);
  };

  const handleRevoke = (id: string, name: string) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isApproved: false } : t))
    );
    info('Permissions Suspended', `Revoked authoring permissions for ${name}.`);
  };

  const pendingList = teachers.filter((t) => !t.isApproved);
  const approvedList = teachers.filter((t) => t.isApproved);

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} />
        <span>Back to Admin Center</span>
      </Link>

      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            User Roles & Teacher Approval Queue
          </h1>
          <Badge variant="amber" size="sm">Gatekeeper Rule Enforced</Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Rule: <strong>Teachers need admin approval.</strong> Admin accounts are strictly seeded into Postgres.
        </p>
      </div>

      {/* Pending Approvals */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>Pending Teacher Approvals ({pendingList.length})</span>
        </h3>

        {pendingList.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No pending requests at this time.</p>
        ) : (
          pendingList.map((req) => (
            <Card key={req.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{req.name}</span>
                    <Badge variant="rose" size="sm">Pending Approval</Badge>
                  </div>
                  <div className="text-xs text-slate-400">
                    {req.email} • {req.school} • Applied: {req.requestedAt}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Check size={14} />}
                    onClick={() => handleApprove(req.id, req.name)}
                  >
                    Approve Educator
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Verified Teachers */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <GraduationCap size={16} />
          <span>Active Approved Teachers ({approvedList.length})</span>
        </h3>

        {approvedList.map((t) => (
          <Card key={t.id}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.name}</span>
                  <Badge variant="emerald" size="sm">Verified Author</Badge>
                </div>
                <div className="text-xs text-slate-400">
                  {t.email} • {t.school}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRevoke(t.id, t.name)}
              >
                Revoke Approval
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
