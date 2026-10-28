import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const { loginAsStub } = useAuth();
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'teacher') {
      // Teachers need admin approval
      loginAsStub('teacher', false);
      navigate('/pending');
    } else {
      loginAsStub('student', true);
      navigate('/student');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Create an Account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Join RecallLoop AI for adaptive computer science practice
          </p>
        </div>

        <Card>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="ada@example.edu"
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

            <Select
              label="Account Role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
              options={[
                { value: 'student', label: 'Student (Direct access)' },
                { value: 'teacher', label: 'Teacher (Requires Admin approval)' },
              ]}
              helperText={
                role === 'teacher'
                  ? 'Note: Teacher accounts require explicit administrative verification before access is granted.'
                  : 'Administrators are strictly seeded and cannot be publicly self-registered.'
              }
            />

            {role === 'teacher' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>
                  Per security rules, your teacher account will enter a <strong>Pending Approval</strong> state until reviewed by a system administrator.
                </span>
              </div>
            )}

            <Button type="submit" className="w-full" leftIcon={<UserPlus size={16} />}>
              Complete Registration
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
