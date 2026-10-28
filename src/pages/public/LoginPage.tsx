import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/database';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginAsStub } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/student';

  const handleStubLogin = (role: UserRole, approved: boolean = true) => {
    loginAsStub(role, approved);
    if (role === 'teacher' && !approved) {
      navigate('/pending');
    } else {
      navigate(`/${role}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default stub authentication login
    loginAsStub('student');
    navigate(from);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Welcome Back</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your adaptive learning dashboard
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="student@recallloop.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" leftIcon={<LogIn size={16} />}>
              Sign In
            </Button>
          </form>

          {/* Quick Sandbox Role Launcher */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Quick Role Testing Simulator
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStubLogin('student')}
              >
                Student Demo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStubLogin('teacher', true)}
              >
                Approved Teacher
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStubLogin('teacher', false)}
              >
                Pending Teacher
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStubLogin('admin')}
              >
                Seeded Admin
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
