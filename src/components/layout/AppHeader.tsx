import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, LogOut, Shield, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const AppHeader: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md h-16">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Brain size={20} />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              RecallLoop AI
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              v2 Multi-Role
            </div>
          </div>
        </Link>

        {/* Navigation links based on role */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          {user?.role === 'student' && (
            <>
              <Link to="/student" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                Student Home
              </Link>
              <Link to="/student/subject/cs-core" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                CS Core
              </Link>
            </>
          )}

          {user?.role === 'teacher' && user.is_approved && (
            <>
              <Link to="/teacher" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                Teacher Dashboard
              </Link>
              <Link to="/teacher/assign" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                Daily Assignment
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/admin" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                Admin Center
              </Link>
              <Link to="/admin/users" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                Teacher Approvals
              </Link>
              <Link to="/admin/subjects" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                Subjects & Topics
              </Link>
              <Link to="/admin/mapping" className="px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                Faculty Mapping
              </Link>
            </>
          )}
        </nav>

        {/* User Actions / Sign In */}
        <div className="flex items-center gap-3">
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
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 text-xs shadow-sm shadow-cyan-500/20 transition-all inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
