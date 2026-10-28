import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ShieldAlert,
  Trash2,
  RotateCcw,
  Users,
  Shield,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { adminService } from '../../services/admin.service';
import type { Profile, UserRole, UserStatus } from '../../types/database';

export const AdminUsersPage: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  const [users, setUsers] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Confirm Dialog State for Deletion
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page: currentPage,
        pageSize,
      });
      setUsers(data.users);
      setTotalCount(data.total);
    } catch (err) {
      toastError('Failed to load users', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, currentPage, pageSize, toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Actions
  const handleApproveTeacher = async (user: Profile) => {
    try {
      const result = await adminService.updateUserStatus(user.id, 'active');
      if (result.success) {
        success('Educator Approved!', `${user.full_name} is now active with authoring privileges.`);
        fetchUsers();
      } else {
        toastError('Failed to approve', result.error);
      }
    } catch (err) {
      toastError('Approval Error', err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleSuspendUser = async (user: Profile) => {
    try {
      const result = await adminService.updateUserStatus(user.id, 'suspended');
      if (result.success) {
        info('Account Suspended', `${user.full_name}'s account has been suspended.`);
        fetchUsers();
      } else {
        toastError('Suspension failed', result.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to suspend user');
    }
  };

  const handleReactivateUser = async (user: Profile) => {
    try {
      const result = await adminService.updateUserStatus(user.id, 'active');
      if (result.success) {
        success('Account Reactivated', `${user.full_name}'s account is active again.`);
        fetchUsers();
      } else {
        toastError('Reactivation failed', result.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to reactivate user');
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const result = await adminService.deleteUser(userToDelete.id);
      if (result.success) {
        success('User Deleted', `${userToDelete.full_name} was removed from the system.`);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toastError('Deletion failed', result.error);
      }
    } catch (err) {
      toastError('Error', err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Breadcrumb / Back button */}
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Admin Center</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              User Management & Verification
            </h1>
            <Badge variant="cyan" size="sm">RBAC Directory</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit student cohorts, approve educator registrations, and manage account statuses.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="user-search"
            label="Search Directory"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

          <Select
            id="role-filter"
            label="Filter by Role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | 'all');
              setCurrentPage(1);
            }}
            options={[
              { value: 'all', label: 'All Roles (Students, Teachers, Admins)' },
              { value: 'student', label: 'Students' },
              { value: 'teacher', label: 'Teachers' },
              { value: 'admin', label: 'Admins' },
            ]}
          />

          <Select
            id="status-filter"
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UserStatus | 'all');
              setCurrentPage(1);
            }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending Approval' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton height={20} className="w-1/4" />
            <Skeleton height={48} className="w-full" />
            <Skeleton height={48} className="w-full" />
            <Skeleton height={48} className="w-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Users size={32} />}
              title="No Users Found"
              description="No user profiles match your filter criteria. Try adjusting the search term or status filters."
              actionText="Clear Filters"
              onAction={() => {
                setSearch('');
                setRoleFilter('all');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {u.full_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {u.email}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <Badge
                          size="sm"
                          variant={
                            u.role === 'admin'
                              ? 'cyan'
                              : u.role === 'teacher'
                              ? 'amber'
                              : 'slate'
                          }
                        >
                          {u.role === 'admin' && <Shield size={10} />}
                          {u.role === 'teacher' && <GraduationCap size={10} />}
                          {u.role === 'student' && <Users size={10} />}
                          <span className="capitalize">{u.role}</span>
                        </Badge>
                      </td>

                      {/* Status Badge (Icon + Text per Rule 4) */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : u.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {u.status === 'active' && <CheckCircle2 size={12} />}
                          {u.status === 'pending' && <Clock size={12} />}
                          {u.status === 'suspended' && <XCircle size={12} />}
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve pending teacher */}
                          {u.role === 'teacher' && u.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="primary"
                              leftIcon={<Check size={12} />}
                              onClick={() => handleApproveTeacher(u)}
                              title="Approve educator authoring access"
                            >
                              Approve
                            </Button>
                          )}

                          {/* Suspend active user (except root admin) */}
                          {u.status === 'active' && u.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<ShieldAlert size={12} className="text-amber-500" />}
                              onClick={() => handleSuspendUser(u)}
                              title="Suspend account access"
                            >
                              Suspend
                            </Button>
                          )}

                          {/* Reactivate suspended user */}
                          {u.status === 'suspended' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={<RotateCcw size={12} className="text-cyan-500" />}
                              onClick={() => handleReactivateUser(u)}
                              title="Reactivate account"
                            >
                              Reactivate
                            </Button>
                          )}

                          {/* Delete profile (Confirm Dialog) */}
                          {u.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => setUserToDelete(u)}
                              title="Delete user profile"
                              aria-label={`Delete ${u.full_name}`}
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            currentPage={currentPage}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </Card>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete User Profile"
        message={`Are you sure you want to delete ${userToDelete?.full_name} (${userToDelete?.email})? This action will permanently remove their records, attempts, and enrollments.`}
        confirmText="Delete User"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
