'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, FileWarning, HelpCircle } from 'lucide-react';

// Form Fields classification & helper
export interface FieldRules {
  [fieldName: string]: {
    required: boolean;
    label: string;
    validate?: (val: any) => string | undefined;
  };
}

// 1. Unified Asterisk/Label Component
export function FormLabel({
  label,
  required,
  htmlFor,
  className = '',
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs uppercase tracking-widest text-neutral-500 font-mono mb-2 ${className}`}
    >
      {label} {required ? <span className="text-red-500 font-bold ml-1">*</span> : <span className="text-neutral-600 text-[10px] font-normal lowercase italic ml-1">(optional)</span>}
    </label>
  );
}

// 2. Inline validation below fields
export function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="text-red-400 font-mono text-[11px] mt-1.5 flex items-center gap-1.5 select-none"
    >
      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      <span>{message}</span>
    </motion.p>
  );
}

// 3. Warning helper (doesn't block save, just notifies of optional-but-good fields)
export function InlineWarning({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="text-amber-500/80 font-mono text-[10px] mt-1.5 flex items-center gap-1.5 select-none">
      <HelpCircle className="w-3 h-3 text-amber-500/70 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// 4. Form-wide Evaluation Summary Banner
export function ValidationSummary({
  errors,
  warnings,
  title = "Incomplete Form",
}: {
  errors: Record<string, string>;
  warnings?: string[];
  title?: string;
}) {
  const errorCount = errors ? Object.keys(errors).length : 0;
  const warningCount = warnings?.length || 0;

  if (errorCount === 0 && warningCount === 0) return null;

  const handleScrollToFirstError = () => {
    // Attempt to find any element with an error warning or a designated input
    const formElement = document.querySelector('.border-rose-500, [aria-invalid="true"]');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 p-4 rounded-md border text-xs font-mono select-none flex flex-col gap-2 ${
        errorCount > 0
          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
          <FileWarning className={`w-4.5 h-4.5 ${errorCount > 0 ? 'text-rose-500' : 'text-amber-500'}`} />
          <span>{title}</span>
        </div>
        {errorCount > 0 && (
          <button
            type="button"
            onClick={handleScrollToFirstError}
            className="underline text-[10px] hover:text-white transition-all cursor-pointer font-semibold"
          >
            Go to first invalid field
          </button>
        )}
      </div>

      <div className="space-y-1 mt-1.5 pl-6 list-disc">
        {errorCount > 0 && (
          <div className="font-bold mb-1">
            ⚠️ This form has {errorCount} incomplete required field(s):
          </div>
        )}
        {Object.entries(errors).map(([field, msg]) => (
          <div key={field} className="text-[11px] text-rose-400/85 flex items-center gap-1.5">
            <span className="text-neutral-500">•</span>
            <span>{msg}</span>
          </div>
        ))}
        {warningCount > 0 && (
          <>
            <div className={`font-bold mt-2 ${errorCount > 0 ? 'text-amber-400' : ''}`}>
              💡 Suggestions to improve post quality ({warningCount}):
            </div>
            {warnings?.map((warn, i) => (
              <div key={i} className="text-[11px] text-amber-400/85 flex items-center gap-1.5">
                <span className="text-neutral-500">•</span>
                <span>{warn}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}

// 5. Friendly translation of database constraints to UI messages
export function parseDbError(err: any): string {
  if (!err) return "An unexpected error occurred while saving.";
  const msg = typeof err === 'string' ? err : err.message || '';
  
  if (msg.includes('unique_violation') || msg.toLowerCase().includes('unique constraint') || msg.includes('already exists')) {
    if (msg.toLowerCase().includes('slug')) {
      return "Unable to save: This URL slug is already taken by another entry.";
    }
    if (msg.toLowerCase().includes('title')) {
      return "Unable to save: An entry with this title already exists.";
    }
    return "Database Error: A unique value constraint was violated. Please make sure identifiers are unique.";
  }
  
  if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('deadline exceeded')) {
    return "Network/Database Timed Out. Please retry or check your connection speed.";
  }
  
  if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('violates foreign key')) {
    return "Critical Link Error: Referenced database record was not found.";
  }

  if (msg.toLowerCase().includes('max length') || msg.toLowerCase().includes('too long')) {
    return "Input validation failed: One of your text fields exceeds maximum database length limits.";
  }

  return msg || "Failed to persist database record. Please ensure all values are correct.";
}
