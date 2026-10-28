import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const LandingPage: React.FC = () => {
  return (
    <div className="py-12 md:py-20 px-4 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Sparkles size={14} />
          <span>RecallLoop AI v2 — Multi-Role Platform</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Learn what you <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">don't know</span>.
        </h1>

        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          An <strong>adaptive and data-driven</strong> learning assistant that diagnoses concept gaps from verified student attempts and recommends targeted practice.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/student">
            <Button size="lg" rightIcon={<ArrowRight size={18} />}>
              Open Student Portal
            </Button>
          </Link>
          <Link to="/teacher">
            <Button variant="secondary" size="lg">
              Teacher Dashboard
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="lg">
              Admin Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <Card hoverable header={<span className="text-xs font-bold text-cyan-500 uppercase">Engine Invariant</span>}>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-cyan-500" size={20} />
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Pure Deterministic Logic</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Mastery percentages and recommendations are purely derived from recorded student attempts. Zero LLM hallucinations in recommendation choices.
          </p>
        </Card>

        <Card hoverable header={<span className="text-xs font-bold text-emerald-500 uppercase">Accessibility First</span>}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-emerald-500" size={20} />
            <h3 className="font-bold text-slate-900 dark:text-slate-100">WCAG Status Invariants</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Never rely on color alone. Status is always communicated via explicit icon + text pairings:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status="not_assessed" size="sm" />
            <StatusBadge status="weak" size="sm" accuracy={33} />
            <StatusBadge status="developing" size="sm" accuracy={65} />
            <StatusBadge status="strong" size="sm" accuracy={90} />
          </div>
        </Card>

        <Card hoverable header={<span className="text-xs font-bold text-indigo-500 uppercase">Role-Based System</span>}>
          <div className="flex items-center gap-3 mb-2">
            <Layers className="text-indigo-500" size={20} />
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Students, Teachers, Admins</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Multi-role governance with database-enforced Row-Level Security. Teachers set one topic assignment per subject per day with admin approval gates.
          </p>
        </Card>
      </div>
    </div>
  );
};
