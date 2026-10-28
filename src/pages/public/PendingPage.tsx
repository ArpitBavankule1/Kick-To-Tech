import React from 'react';
import { Clock, ShieldAlert, LogOut, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export const PendingPage: React.FC = () => {
  const { user, loginAsStub, signOut } = useAuth();
  const navigate = useNavigate();

  const isSuspended = user?.status === 'suspended';

  const handleSimulateApproval = () => {
    loginAsStub('teacher', true, 'active');
    navigate('/teacher');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6 text-center">
        {/* Status Icon */}
        <div
          className={`inline-flex p-4 rounded-full border shadow-sm ${
            isSuspended
              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/10'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10'
          }`}
          role="img"
          aria-label={isSuspended ? 'Account suspended notice' : 'Account pending approval notice'}
        >
          {isSuspended ? <ShieldAlert size={44} /> : <Clock size={44} />}
        </div>

        {/* Heading & Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant={isSuspended ? 'rose' : 'amber'} size="md">
              {isSuspended ? <ShieldAlert size={12} /> : <Clock size={12} />}
              <span>{isSuspended ? 'Access Suspended' : 'Pending Verification'}</span>
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {isSuspended ? 'Account Temporarily Suspended' : 'Educator Account Pending Review'}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            {isSuspended
              ? `The account associated with ${user?.email || 'your email'} is currently suspended by system administration. Please contact support to resolve account status.`
              : `Thank you for joining RecallLoop AI. Your educator account (${user?.email || 'your email'}) has been registered and is queued for administrative authorization.`}
          </p>
        </div>

        {/* Detail Card */}
        <Card>
          <div className="space-y-4 text-left text-xs text-slate-600 dark:text-slate-400">
            {isSuspended ? (
              <>
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Policy:</strong> Suspended accounts cannot access assignments, student attempt records, or author questions.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail size={18} className="text-cyan-500 shrink-0 mt-0.5" />
                  <span>
                    If you believe this was in error, please reach out via our contact form below.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Multi-Role Governance Rule:</strong> Teachers require manual admin verification before publishing daily topics or accessing cohort analytics.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock size={18} className="text-cyan-500 shrink-0 mt-0.5" />
                  <span>
                    Once approved in the Admin Center, your account status will automatically switch to active.
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            {!isSuspended && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                leftIcon={<CheckCircle2 size={16} className="text-emerald-500" />}
                onClick={handleSimulateApproval}
                aria-label="Simulate admin approval for testing"
              >
                Simulate Admin Approval (Dev Simulator)
              </Button>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/#contact" className="flex-1">
                <Button variant="outline" size="sm" className="w-full" leftIcon={<Mail size={14} />}>
                  Contact Support
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                leftIcon={<LogOut size={14} />}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
