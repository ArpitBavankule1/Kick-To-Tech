import React from 'react';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const PendingPage: React.FC = () => {
  const { user, loginAsStub, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSimulateApproval = () => {
    loginAsStub('teacher', true);
    navigate('/teacher');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="inline-flex p-4 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock size={40} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Teacher Approval Pending
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Thank you for registering as an educator. Your account ({user?.email || 'educator@school.edu'}) is currently under administrative review.
          </p>
        </div>

        <Card>
          <div className="space-y-3 text-left text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Institutional Rule:</strong> Teachers require manual admin verification before they can author assignments or view student cohort analytics.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-cyan-500 shrink-0 mt-0.5" />
              <span>
                Approval requests are audited from the Admin Center. Once approved, you will have immediate publishing access.
              </span>
            </div>
          </div>

          {/* Dev helper to test approval */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              leftIcon={<CheckCircle2 size={16} className="text-emerald-500" />}
              onClick={handleSimulateApproval}
            >
              Simulate Admin Approval (Dev)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              leftIcon={<LogOut size={16} />}
              onClick={() => {
                signOut();
                navigate('/login');
              }}
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
