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
    <div className="mx-auto w-full max-w-6xl px-6 md:px-8">
      {/* 1. HERO SECTION */}
      <section className="py-20 md:py-28 text-center flex flex-col items-center justify-center">
        {/* Feature Chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6">
          <Sparkles size={14} />
          <span>RecallLoop AI v2 — Multi-Role Adaptive Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
          Learn what you{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            don't know
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg text-slate-300 mt-6 leading-relaxed max-w-[65ch]">
          An <strong className="text-white font-semibold">adaptive and data-driven</strong> learning assistant that diagnoses concept gaps from verified student attempts and recommends targeted practice.
        </p>

        {/* CTA Row */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {user ? (
            <Link to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student'}>
              <Button
                size="lg"
                className="px-6 py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300"
                rightIcon={<ArrowRight size={18} />}
              >
                Go to Your Dashboard ({user.role})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button
                  size="lg"
                  className="px-6 py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300"
                  rightIcon={<ArrowRight size={18} />}
                >
                  Register as Student or Teacher
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="secondary"
                  size="lg"
                  className="px-6 py-3 rounded-xl border border-slate-600 text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Sign In
                </Button>
              </Link>
            </>
          )}
          <a href="#about">
            <Button
              variant="secondary"
              size="lg"
              className="px-6 py-3 rounded-xl border border-slate-600 text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Explore How It Works
            </Button>
          </a>
        </div>

        {/* Feature Chips Row */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-cyan-400 shrink-0" />
            <span>Deterministic Math Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <span>Row-Level Security Guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-indigo-400 shrink-0" />
            <span>Multi-Role Governance</span>
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION: THE LEARNING LOOP & ROLES */}
      <section id="about" className="py-16 md:py-24 border-t border-slate-800/80 scroll-mt-16">
        {/* Section Heading Block */}
        <div className="mb-10 max-w-2xl mx-auto text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Continuous Adaptation Loop
          </h2>
          <p className="text-base text-slate-300 leading-relaxed max-w-[65ch] mx-auto">
            Traditional quiz apps assign arbitrary scores. RecallLoop AI executes a closed feedback loop:{' '}
            <strong className="text-white font-semibold">Answer &rarr; Analyze &rarr; Recommend &rarr; Practice &rarr; Improve</strong>.
          </p>
        </div>

        {/* 5-Step Loop Visual Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
          {/* Card 1: Answer */}
          <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 h-full flex flex-col gap-3 justify-between hover:border-slate-500/80 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <HelpCircle size={18} className="text-cyan-400 shrink-0" />
                <span>Answer</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Students solve multi-choice challenges with verified distractor rationale keys.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-xs font-semibold text-cyan-400">
              Verified MCQs
            </div>
          </div>

          {/* Card 2: Analyze */}
          <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 h-full flex flex-col gap-3 justify-between hover:border-slate-500/80 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <BarChart3 size={18} className="text-blue-400 shrink-0" />
                <span>Analyze</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Attempts table dynamically derives mastery per topic without storing stale percentages.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-xs font-semibold text-blue-400">
              Zero Stored Scores
            </div>
          </div>

          {/* Card 3: Recommend */}
          <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 h-full flex flex-col gap-3 justify-between hover:border-slate-500/80 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <Compass size={18} className="text-indigo-400 shrink-0" />
                <span>Recommend</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Deterministic engine picks the weakest assessed topic with available questions.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-xs font-semibold text-indigo-400">
              Deterministic Logic
            </div>
          </div>

          {/* Card 4: Practice */}
          <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 h-full flex flex-col gap-3 justify-between hover:border-slate-500/80 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <Repeat size={18} className="text-amber-400 shrink-0" />
                <span>Practice</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Targeted practice reinforces concepts with explicit error diagnosis and code snippets.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-xs font-semibold text-amber-400">
              Immediate Feedback
            </div>
          </div>

          {/* Card 5: Improve */}
          <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 h-full flex flex-col gap-3 justify-between hover:border-slate-500/80 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                5
              </div>
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <TrendingUp size={18} className="text-emerald-400 shrink-0" />
                <span>Improve</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Knowledge map transitions from Weak to Developing to Strong with verifiable progress.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-xs font-semibold text-emerald-400">
              Mastery Growth
            </div>
          </div>
        </div>

        {/* The Three Platform Roles */}
        <div className="mt-16 space-y-10">
          <div className="mb-10 max-w-2xl mx-auto text-center space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Designed for Three Specialized Roles
            </h3>
            <p className="text-base text-slate-300 leading-relaxed max-w-[65ch] mx-auto">
              Institutional security and role segregation enforced at the database level with Supabase RLS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Role 1: Student */}
            <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 h-full flex flex-col gap-3 hover:border-slate-500/80 transition-all duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-sm font-semibold text-cyan-400">
                  Role: Student
                </span>
                <Users size={18} className="text-cyan-400" />
              </div>
              <h4 className="font-bold text-white text-base mt-1">
                Adaptive Practice & Mastery
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
                <li>Self-registers with instructor subject code (e.g. CS101).</li>
                <li>Receives dynamic recommendations derived strictly from recorded attempts.</li>
                <li>Complete privacy: students cannot view other students' attempts or unassigned course data.</li>
              </ul>
            </div>

            {/* Role 2: Teacher */}
            <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 h-full flex flex-col gap-3 hover:border-slate-500/80 transition-all duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-sm font-semibold text-amber-400">
                  Role: Teacher
                </span>
                <GraduationCap size={18} className="text-amber-400" />
              </div>
              <h4 className="font-bold text-white text-base mt-1">
                Daily Topics & Analytics
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
                <li>Institutes one assigned topic per subject per day (unique constraint).</li>
                <li>Audits cohort mastery and weak concepts without seeing unassigned subjects.</li>
                <li>Requires administrator approval gate before publishing permissions unlock.</li>
              </ul>
            </div>

            {/* Role 3: Admin */}
            <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 h-full flex flex-col gap-3 hover:border-slate-500/80 transition-all duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-sm font-semibold text-indigo-400">
                  Role: Admin
                </span>
                <ShieldAlert size={18} className="text-indigo-400" />
              </div>
              <h4 className="font-bold text-white text-base mt-1">
                Platform Governance
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
                <li>Strictly seeded root administrator; never public self-registration.</li>
                <li>Verifies and activates pending educator accounts.</li>
                <li>Manages subjects catalog and reviews contact inquiries.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* WCAG Accessibility Highlight */}
        <div className="mt-12 p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck size={16} />
            <span>WCAG Guideline Invariant (Rule 4)</span>
          </div>
          <h4 className="text-lg font-bold text-white">
            Status Is Never Communicated By Color Alone
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed max-w-[65ch]">
            Every status element pairs semantic text with a distinct icon. 0 attempts is explicitly labeled "Not Assessed", while 0% with attempts is labeled "Weak":
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <StatusBadge status="not_assessed" size="sm" />
            <StatusBadge status="weak" size="sm" accuracy={0} />
            <StatusBadge status="developing" size="sm" accuracy={65} />
            <StatusBadge status="strong" size="sm" accuracy={92} />
          </div>
        </div>
      </section>

      {/* 3. CONTACT SECTION */}
      <section id="contact" className="py-16 md:py-24 border-t border-slate-800/80 scroll-mt-16">
        <div className="mb-10 max-w-2xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
            <Mail size={12} />
            <span>Institutional Inquiries & Support</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Contact RecallLoop AI
          </h2>
          <p className="text-base text-slate-300 leading-relaxed max-w-[65ch] mx-auto">
            Have questions about student enrollment, teacher verifications, or course configurations? Send us a message and our administration team will assist you.
          </p>
        </div>

        <div className="max-w-xl mx-auto p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60">
          {contactSuccess && (
            <div
              className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2.5"
              role="status"
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>{contactSuccess}</span>
            </div>
          )}

          {contactError && (
            <div
              className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
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
                className="block text-xs font-semibold text-slate-300"
              >
                Message <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="contact-message"
                rows={4}
                required
                disabled={isSubmitting}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="How can we assist your learning cohort?"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-all resize-y"
              />
            </div>

            <Button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300"
              isLoading={isSubmitting}
              leftIcon={<Send size={16} />}
            >
              Send Message
            </Button>
          </form>
        </div>
      </section>

      {/* 4. FOOTER & PRIVACY NOTE */}
      <footer className="py-16 border-t border-slate-700/60 space-y-8 text-sm text-slate-300">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-extrabold text-base text-white">
              RecallLoop AI v2
            </div>
            <div className="text-xs text-slate-400">
              Tagline: <em>Learn what you don't know.</em>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-medium">
            <Link to="/student" className="hover:text-cyan-400 transition-colors">
              Student Portal
            </Link>
            <Link to="/teacher" className="hover:text-amber-400 transition-colors">
              Teacher Dashboard
            </Link>
            <Link to="/admin" className="hover:text-indigo-400 transition-colors">
              Admin Center
            </Link>
            <Link to="/login" className="hover:text-cyan-400 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-cyan-400 transition-colors">
              Register
            </Link>
          </div>
        </div>

        {/* Short Privacy Note */}
        <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 flex items-start gap-3 text-xs leading-relaxed text-slate-300">
          <Lock size={16} className="shrink-0 mt-0.5 text-cyan-400" />
          <span>
            <strong className="text-white">Privacy Note:</strong> RecallLoop AI collects only minimal required user credentials (name, email) and student question attempt records to calculate dynamic concept mastery. All contact inquiries are strictly stored in the database accessible exclusively by authenticated system administrators. We do not sell or monetize personal academic records.
          </span>
        </div>

        <div className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} RecallLoop AI. Adaptive and data-driven learning assistant.
        </div>
      </footer>
    </div>
  );
};
