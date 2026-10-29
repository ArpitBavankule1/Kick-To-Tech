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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] max-w-full h-[360px] bg-gradient-to-tr from-cyan-500/10 via-blue-500/10 to-indigo-500/10 blur-[110px] pointer-events-none rounded-full" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-sm text-slate-300">
            Join RecallLoop AI — adaptive, data-driven learning
          </p>
        </div>

        <Card className="shadow-2xl backdrop-blur-xl border-slate-700/60 bg-slate-900/70">
          {/* Role Chooser Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Your Role <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                aria-pressed={role === 'teacher'}
              >
                <GraduationCap size={16} />
                <span>Teacher</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 px-1">
              {role === 'student'
                ? 'Immediate access to adaptive quizzes and practice in enrolled subjects.'
                : 'Educator access to assign daily topics. Requires administrator verification.'}
            </p>
          </div>

          {/* Error & Success Alerts */}
          {errorMessage && (
            <div
              className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2.5"
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

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <Shield size={16} className="shrink-0 mt-0.5 text-amber-400" />
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
          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Lock size={14} className="shrink-0 mt-0.5 text-cyan-400" />
            <span>
              <strong>Privacy Note:</strong> We collect only your name, email, and academic quiz attempt logs to compute dynamic concept mastery. We never sell your personal data or share it with external third parties.
            </span>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-300">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
