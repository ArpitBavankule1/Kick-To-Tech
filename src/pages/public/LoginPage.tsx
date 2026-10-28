import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole, UserStatus } from '../../types/database';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, loginAsStub } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleRedirectAfterLogin = (role: UserRole, status: UserStatus, isApproved: boolean) => {
    // If pending or suspended, go directly to /pending
    if (status === 'pending' || status === 'suspended' || (role === 'teacher' && !isApproved)) {
      navigate('/pending', { replace: true });
      return;
    }

    // If there was a redirect source they are authorized for
    if (from && !from.includes('/login') && !from.includes('/register')) {
      navigate(from, { replace: true });
      return;
    }

    // Role-based home redirect
    switch (role) {
      case 'student':
        navigate('/student', { replace: true });
        break;
      case 'teacher':
        navigate('/teacher', { replace: true });
        break;
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const authUser = await signIn(email, password);
      setSuccessMessage('Authentication successful. Redirecting...');
      setTimeout(() => {
        handleRedirectAfterLogin(authUser.role, authUser.status, authUser.is_approved);
      }, 500);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStubLogin = (role: UserRole, approved: boolean = true, customStatus?: UserStatus) => {
    loginAsStub(role, approved, customStatus);
    const status: UserStatus = customStatus || (role === 'teacher' && !approved ? 'pending' : 'active');
    handleRedirectAfterLogin(role, status, approved);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20">
            <Sparkles size={12} />
            <span>Multi-Role Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Sign In to RecallLoop AI
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Access your adaptive dashboard and practice modules
          </p>
        </div>

        <Card>
          {errorMessage && (
            <div
              className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5"
              role="status"
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email"
              label="Email Address"
              type="email"
              placeholder="name@recallloop.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              id="login-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              leftIcon={<LogIn size={16} />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Sandbox Role Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
              Quick Role Evaluation Simulator
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStubLogin('student')}
                aria-label="Sign in as student demo"
              >
                Student Demo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStubLogin('teacher', true)}
                aria-label="Sign in as approved educator"
              >
                Approved Teacher
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStubLogin('teacher', false, 'pending')}
                aria-label="Sign in as pending teacher"
              >
                Pending Teacher
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStubLogin('admin')}
                aria-label="Sign in as administrator"
              >
                Seeded Admin
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            Register as Student or Teacher
          </Link>
        </p>
      </div>
    </div>
  );
};
