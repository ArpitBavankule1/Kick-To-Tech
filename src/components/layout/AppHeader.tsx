import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, LogOut, Shield, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { UserRole } from '../../types/database';

export const AppHeader: React.FC = () => {
  const { user, loginAsStub, signOut } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (newRole: UserRole, approved: boolean = true) => {
    loginAsStub(newRole, approved);
    if (newRole === 'teacher' && !approved) {
      navigate('/pending');
    } else {
      navigate(`/${newRole}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Brain size={20} />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              RecallLoop AI
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">
              v2 Multi-Role
            </div>
          </div>
        </Link>

        {/* Navigation links based on role */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {user?.role === 'student' && (
            <>
              <Link to="/student" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Student Home
              </Link>
              <Link to="/student/subject/cs-core" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                CS Core
              </Link>
            </>
          )}

          {user?.role === 'teacher' && user.is_approved && (
            <>
              <Link to="/teacher" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Teacher Dashboard
              </Link>
              <Link to="/teacher/assign" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Daily Assignment
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/admin" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Admin Center
              </Link>
              <Link to="/admin/users" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Teacher Approvals
              </Link>
              <Link to="/admin/subjects" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Subjects & Topics
              </Link>
              <Link to="/admin/mapping" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Faculty Mapping
              </Link>
            </>
          )}
        </nav>

        {/* Role Quick Switcher & User Actions */}
        <div className="flex items-center gap-2">
          {/* Dev Role Quick Switcher */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Switch:</span>
            <button
              type="button"
              onClick={() => handleRoleSwitch('student')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                user?.role === 'student'
                  ? 'bg-cyan-500 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('teacher', true)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                user?.role === 'teacher' && user.is_approved
                  ? 'bg-amber-500 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('teacher', false)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                user?.role === 'teacher' && !user.is_approved
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Test unapproved teacher gate"
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                user?.role === 'admin'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Admin
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  user.role === 'admin'
                    ? 'cyan'
                    : user.role === 'teacher'
                    ? 'amber'
                    : 'emerald'
                }
                size="sm"
              >
                {user.role === 'admin' && <Shield size={10} />}
                {user.role === 'teacher' && <GraduationCap size={10} />}
                {user.role === 'student' && <Users size={10} />}
                <span className="capitalize">{user.role}</span>
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
