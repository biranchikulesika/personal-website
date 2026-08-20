import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';

// Label ------------------------------------------------------------------------

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, children, className = '', ...props }: LabelProps) {
  return (
    <label
      className={`block text-[11px] font-semibold uppercase tracking-wider text-ink-soft ${className}`}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-accent">*</span>}
    </label>
  );
}

// Input ------------------------------------------------------------------------

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, description, error, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="space-y-1.5">
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-xl border bg-night-soft px-3.5 py-2 text-sm text-paper',
            'placeholder:text-gray-mid/50 focus:border-accent focus:outline-none',
            error ? 'border-red-500/60' : 'border-tinted/20',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {description && !error && (
          <p className="text-[10px] text-ink-soft">{description}</p>
        )}
        {error && (
          <p className="text-[10px] text-red-400">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

// Textarea ---------------------------------------------------------------------

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, description, error, id, className = '', ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="space-y-1.5">
        {label && <Label htmlFor={textareaId}>{label}</Label>}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'w-full resize-none rounded-xl border bg-night-soft px-3.5 py-2 text-sm text-paper',
            'placeholder:text-gray-mid/50 focus:border-accent focus:outline-none',
            error ? 'border-red-500/60' : 'border-tinted/20',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {description && !error && (
          <p className="text-[10px] text-ink-soft">{description}</p>
        )}
        {error && (
          <p className="text-[10px] text-red-400">{error}</p>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

// Select -----------------------------------------------------------------------

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, description, error, id, className = '', children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="space-y-1.5">
        {label && <Label htmlFor={selectId}>{label}</Label>}
        <select
          ref={ref}
          id={selectId}
          className={[
            'w-full rounded-xl border bg-night-soft px-3.5 py-2 text-sm text-paper',
            'focus:border-accent focus:outline-none',
            error ? 'border-red-500/60' : 'border-tinted/20',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {children}
        </select>
        {description && !error && (
          <p className="text-[10px] text-ink-soft">{description}</p>
        )}
        {error && (
          <p className="text-[10px] text-red-400">{error}</p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';

// FormGroup --------------------------------------------------------------------

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

/** Wraps form fields with consistent vertical spacing. */
export function FormGroup({ children, className = '' }: FormGroupProps) {
  return (
    <div className={`space-y-4 ${className}`}>{children}</div>
  );
}
