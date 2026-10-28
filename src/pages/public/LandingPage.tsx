import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  HelpCircle,
  BarChart3,
  Compass,
  Repeat,
  TrendingUp,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Lock,
  GraduationCap,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { contactService } from '../../services/contact.service';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(null);

    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await contactService.submitMessage({
        name: contactName,
        email: contactEmail,
        subject: contactSubject || 'General Inquiry',
        message: contactMessage,
        userId: user?.id,
      });

      if (result.success) {
        setContactSuccess('Your message has been received! Our administration team will review it.');
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      } else {
        setContactError(result.error || 'Failed to submit message. Please try again.');
      }
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-24 py-10 md:py-16 px-4 max-w-6xl mx-auto">
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
          <Sparkles size={14} />
          <span>RecallLoop AI v2 — Multi-Role Adaptive Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          Learn what you{' '}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
            don't know
          </span>
          .
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          An <strong className="text-slate-900 dark:text-white">adaptive and data-driven</strong> learning assistant that diagnoses concept gaps from verified student attempts and recommends targeted practice.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
          {user ? (
            <Link to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student'}>
              <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                Go to Your Dashboard ({user.role})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                  Register as Student or Teacher
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </>
          )}
          <a href="#about">
            <Button variant="outline" size="lg">
              Explore How It Works
            </Button>
          </a>
        </div>

        {/* Core Invariants Ribbon */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-cyan-500" />
            <span>Deterministic Math Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Row-Level Security Guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-indigo-500" />
            <span>Multi-Role Governance</span>
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION: THE LEARNING LOOP & ROLES */}
      <section id="about" className="space-y-16 scroll-mt-24">
        {/* Loop Explanation */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            The Continuous Adaptation Loop
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Traditional quiz apps assign arbitrary scores. RecallLoop AI executes a closed feedback loop:
            <strong className="text-slate-900 dark:text-slate-200"> Answer &rarr; Analyze &rarr; Recommend &rarr; Practice &rarr; Improve</strong>.
          </p>
        </div>

        {/* 5-Step Loop Visual Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="flex flex-col justify-between" hoverable>
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                <HelpCircle size={16} className="text-cyan-500" />
                <span>Answer</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Students solve multi-choice challenges with verified distractor rationale keys.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-cyan-500">
              Verified MCQs
            </div>
          </Card>

          <Card className="flex flex-col justify-between" hoverable>
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                <BarChart3 size={16} className="text-blue-500" />
                <span>Analyze</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Attempts table dynamically derives mastery per topic without storing stale percentages.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-blue-500">
              Zero Stored Scores
            </div>
          </Card>

          <Card className="flex flex-col justify-between" hoverable>
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Compass size={16} className="text-indigo-500" />
                <span>Recommend</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Deterministic engine picks the weakest assessed topic with available questions.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-indigo-500">
              Deterministic Logic
            </div>
          </Card>

          <Card className="flex flex-col justify-between" hoverable>
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Repeat size={16} className="text-amber-500" />
                <span>Practice</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Targeted practice reinforces concepts with explicit error diagnosis and code snippets.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-amber-500">
              Immediate Feedback
            </div>
          </Card>

          <Card className="flex flex-col justify-between" hoverable>
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                5
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                <TrendingUp size={16} className="text-emerald-500" />
                <span>Improve</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Knowledge map transitions from Weak to Developing to Strong with verifiable progress.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-emerald-500">
              Mastery Growth
            </div>
          </Card>
        </div>

        {/* The Three Platform Roles */}
        <div className="space-y-6 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Designed for Three Specialized Roles
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Institutional security and role segregation enforced at the database level with Supabase RLS.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card
              hoverable
              header={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                    Role: Student
                  </span>
                  <Users size={16} className="text-cyan-500" />
                </div>
              }
            >
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Adaptive Practice & Mastery
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Self-registers with instructor subject code (e.g. CS101).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Receives dynamic recommendations derived strictly from recorded attempts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Complete privacy: students cannot view other students' attempts or unassigned course data.</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card
              hoverable
              header={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Role: Teacher
                  </span>
                  <GraduationCap size={16} className="text-amber-500" />
                </div>
              }
            >
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Daily Topics & Analytics
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Institutes one assigned topic per subject per day (unique constraint).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Audits cohort mastery and weak concepts without seeing unassigned subjects.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Requires administrator approval gate before publishing permissions unlock.</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card
              hoverable
              header={
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    Role: Admin
                  </span>
                  <ShieldAlert size={16} className="text-indigo-500" />
                </div>
              }
            >
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Platform Governance
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Strictly seeded root administrator; never public self-registration.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Verifies and activates pending educator accounts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Manages subjects catalog and reviews contact inquiries.</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        {/* WCAG Accessibility Highlight */}
        <div className="p-6 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
              <span>WCAG Guideline Invariant (Rule 4)</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Status Is Never Communicated By Color Alone
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every status element pairs semantic text with a distinct icon. 0 attempts is explicitly labeled "Not Assessed", while 0% with attempts is labeled "Weak":
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <StatusBadge status="not_assessed" size="sm" />
              <StatusBadge status="weak" size="sm" accuracy={0} />
              <StatusBadge status="developing" size="sm" accuracy={65} />
              <StatusBadge status="strong" size="sm" accuracy={92} />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTACT SECTION */}
      <section id="contact" className="space-y-8 scroll-mt-24 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20">
            <Mail size={12} />
            <span>Institutional Inquiries & Support</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Contact RecallLoop AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Have questions about student enrollment, teacher verifications, or course configurations? Send us a message and our administration team will assist you.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <Card>
            {contactSuccess && (
              <div
                className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5"
                role="status"
              >
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>{contactSuccess}</span>
              </div>
            )}

            {contactError && (
              <div
                className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5"
                role="alert"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{contactError}</span>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <Input
                id="contact-name"
                label="Your Name"
                type="text"
                placeholder="e.g. Dr. Alan Turing"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                disabled={isSubmitting}
              />

              <Input
                id="contact-email"
                label="Email Address"
                type="email"
                placeholder="name@institution.edu"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />

              <Input
                id="contact-subject"
                label="Subject Line"
                type="text"
                placeholder="e.g. Teacher Verification or Course Setup"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                disabled={isSubmitting}
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  disabled={isSubmitting}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="How can we assist your learning cohort?"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-y"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                leftIcon={<Send size={16} />}
              >
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* 4. FOOTER & PRIVACY NOTE */}
      <footer className="pt-12 border-t border-slate-200 dark:border-slate-800 space-y-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              RecallLoop AI v2
            </div>
            <div className="text-xs">
              Tagline: <em>Learn what you don't know.</em>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link to="/student" className="hover:text-cyan-500 transition-colors">
              Student Portal
            </Link>
            <Link to="/teacher" className="hover:text-amber-500 transition-colors">
              Teacher Dashboard
            </Link>
            <Link to="/admin" className="hover:text-indigo-500 transition-colors">
              Admin Center
            </Link>
            <Link to="/login" className="hover:text-cyan-500 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-cyan-500 transition-colors">
              Register
            </Link>
          </div>
        </div>

        {/* Short Privacy Note */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-[11px] leading-relaxed">
          <Lock size={15} className="shrink-0 mt-0.5 text-cyan-500" />
          <span>
            <strong>Privacy Note:</strong> RecallLoop AI collects only minimal required user credentials (name, email) and student question attempt records to calculate dynamic concept mastery. All contact inquiries are strictly stored in the database accessible exclusively by authenticated system administrators. We do not sell or monetize personal academic records.
          </span>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} RecallLoop AI. Adaptive and data-driven learning assistant.
        </div>
      </footer>
    </div>
  );
};
