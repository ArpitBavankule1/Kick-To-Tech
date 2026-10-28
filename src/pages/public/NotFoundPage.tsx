import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900 text-cyan-500 mb-4 border border-slate-200 dark:border-slate-800">
        <Compass size={48} />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        The route you are navigating to does not exist or has been migrated in RecallLoop AI v2.
      </p>
      <Link to="/">
        <Button leftIcon={<ArrowLeft size={16} />}>
          Return to Platform Home
        </Button>
      </Link>
    </div>
  );
};
