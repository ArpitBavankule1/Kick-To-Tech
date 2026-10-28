import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, GraduationCap, Users, Shield, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { subjectsService } from '../../services/subjects.service';
import type { Subject } from '../../types/database';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subjectCode, setSubjectCode] = useState('CS101');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { registerStudent, registerTeacher } = useAuth();
  const navigate = useNavigate();

  // Load available subjects on mount
  useEffect(() => {
    let mounted = true;
    subjectsService.getAvailableSubjects().then((subs) => {
      if (mounted && subs.length > 0) {
        setAvailableSubjects(subs);
        setSelectedSubjectId(subs[0].id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validations
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (role === 'student') {
        if (!subjectCode.trim()) {
          setErrorMessage('Please enter an enrollment subject code (e.g. CS101).');
          setIsLoading(false);
          return;
        }

        const { subjectName } = await registerStudent({
          name: fullName,
          email,
          password,
          subjectCode,
        });

        setSuccessMessage(`Account created! Enrolled in "${subjectName}". Redirecting...`);
        setTimeout(() => {
          navigate('/student');
        }, 800);
      } else {
        await registerTeacher({
          name: fullName,
          email,
          password,
          subjectId: selectedSubjectId || availableSubjects[0]?.id || 'subj-cs101',
        });

        setSuccessMessage('Account registered! Redirecting to pending review...');
        setTimeout(() => {
          navigate('/pending');
        }, 800);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Join RecallLoop AI — adaptive, data-driven learning
          </p>
        </div>

        <Card>
          {/* Role Chooser Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Your Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'student'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                aria-pressed={role === 'student'}
              >
                <Users size={16} />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('teacher');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'teacher'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                aria-pressed={role === 'teacher'}
              >
                <GraduationCap size={16} />
                <span>Teacher</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 px-1">
              {role === 'student'
                ? 'Immediate access to adaptive quizzes and practice in enrolled subjects.'
                : 'Educator access to assign daily topics. Requires administrator verification.'}
            </p>
          </div>

          {/* Error & Success Alerts */}
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

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              id="register-fullname"
              label="Full Name"
              type="text"
              placeholder="e.g. Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              id="register-email"
              label="Email Address"
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              id="register-password"
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            {/* Role-Specific Fields */}
            {role === 'student' ? (
              <div className="space-y-1">
                <Input
                  id="register-subject-code"
                  label="Subject / Course Code"
                  type="text"
                  placeholder="e.g. CS101"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  required
                  disabled={isLoading}
                  helperText="Enter the course code provided by your instructor. Default course is CS101 (Programming in C)."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Select
                  id="register-subject-select"
                  label="Primary Teaching Subject"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  options={availableSubjects.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.code})`,
                  }))}
                  helperText="Select the department subject you will author daily topic assignments for."
                  disabled={isLoading}
                />

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <Shield size={16} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    <strong>Rule:</strong> Newly registered teachers are set to <strong>pending</strong> status and cannot author assignments until approved by an administrator.
                  </span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              leftIcon={<UserPlus size={16} />}
            >
              {role === 'student' ? 'Register & Enroll' : 'Submit Educator Application'}
            </Button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Lock size={14} className="shrink-0 mt-0.5 text-slate-400" />
            <span>
              <strong>Privacy Note:</strong> We collect only your name, email, and academic quiz attempt logs to compute dynamic concept mastery. We never sell your personal data or share it with external third parties.
            </span>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
