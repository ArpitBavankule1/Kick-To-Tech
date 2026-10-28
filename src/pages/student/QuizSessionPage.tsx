import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { QUESTIONS } from '../../data/questions';

export const QuizSessionPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const question = QUESTIONS[currentIdx] || QUESTIONS[0];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null || isAnswered) return;
    setIsAnswered(true);
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOption(null);
    setCurrentIdx((prev) => (prev + 1) % QUESTIONS.length);
  };

  const isCorrect = selectedOption === question.correctAnswer;

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/student" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <ArrowLeft size={14} />
          <span>Exit to Student Dashboard</span>
        </Link>
        <Badge variant="cyan" size="sm">
          Session: {assignmentId || 'Adaptive Mode'}
        </Badge>
      </div>

      {/* Adaptive Recommendation Reason */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-cyan-400" />
          <span className="font-bold text-cyan-400 uppercase tracking-wider">
            Targeting Priority Focus: {question.topicTitle}
          </span>
        </div>
        <p>
          Derived weakness detected on <strong>"{question.concept}"</strong>. This question is deterministically selected to test your conceptual model.
        </p>
      </div>

      {/* Question Card */}
      <Card>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Question {currentIdx + 1} of {QUESTIONS.length}</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-500 font-semibold">{question.topicTitle}</span>
          </div>
          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
            {question.difficulty}
          </span>
        </div>

        <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 leading-snug">
          {question.question}
        </h3>

        {question.codeSnippet && (
          <div className="p-3 mb-5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-400 overflow-x-auto">
            <pre><code>{question.codeSnippet}</code></pre>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2 mb-5">
          {question.options.map((opt, idx) => {
            let optionStyles = 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';
            if (isAnswered) {
              if (idx === question.correctAnswer) {
                optionStyles = 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold';
              } else if (idx === selectedOption) {
                optionStyles = 'bg-rose-500/15 border-rose-500 text-rose-300';
              }
            } else if (selectedOption === idx) {
              optionStyles = 'border-cyan-500 bg-cyan-500/10 text-cyan-400';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left text-xs md:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer ${optionStyles}`}
              >
                <span className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 font-bold text-xs">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Action button */}
        {!isAnswered ? (
          <div className="flex justify-end">
            <Button
              size="md"
              onClick={handleSubmit}
              disabled={selectedOption === null}
              rightIcon={<ArrowRight size={16} />}
            >
              Submit Answer
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="font-bold text-emerald-500 text-sm">Correct Answer</span>
                </>
              ) : (
                <>
                  <XCircle size={18} className="text-rose-500" />
                  <span className="font-bold text-rose-500 text-sm">Incorrect Choice</span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {question.explanation}
            </p>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleNext} rightIcon={<ArrowRight size={14} />}>
                Next Adaptive Question
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
