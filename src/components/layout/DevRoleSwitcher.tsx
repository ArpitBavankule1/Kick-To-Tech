import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/database';

export const DevRoleSwitcher: React.FC = () => {
  const { user, loginAsStub } = useAuth();
  const navigate = useNavigate();

  if (!import.meta.env.DEV) {
    return null;
  }

  const handleRoleSwitch = (newRole: UserRole, approved: boolean = true) => {
    loginAsStub(newRole, approved);
    if (newRole === 'teacher' && !approved) {
      navigate('/pending');
    } else {
      navigate(`/${newRole}`);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 p-1.5 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center gap-1 text-xs"
      role="region"
      aria-label="Development Role Switcher"
    >
      <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Switch:</span>
      <button
        type="button"
        onClick={() => handleRoleSwitch('student')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
          user?.role === 'student'
            ? 'bg-cyan-500 text-white font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
      >
        Student
      </button>
      <button
        type="button"
        onClick={() => handleRoleSwitch('teacher', true)}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
          user?.role === 'teacher' && user.is_approved
            ? 'bg-amber-500 text-white font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
      >
        Teacher
      </button>
      <button
        type="button"
        onClick={() => handleRoleSwitch('teacher', false)}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
          user?.role === 'teacher' && !user.is_approved
            ? 'bg-rose-500 text-white font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
        title="Test unapproved teacher gate"
      >
        Pending
      </button>
      <button
        type="button"
        onClick={() => handleRoleSwitch('admin')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
          user?.role === 'admin'
            ? 'bg-indigo-600 text-white font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
      >
        Admin
      </button>
    </div>
  );
};
