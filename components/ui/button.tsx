import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonRadius = 'full' | 'lg' | 'xl' | '2xl' | '3xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-paper shadow-sm hover:bg-accent-hover active:brightness-95',
  secondary:
    'border border-tinted/20 bg-post-card text-paper shadow-2xs hover:bg-night-soft',
  ghost:
    'text-gray-mid hover:bg-night-soft hover:text-paper',
  destructive:
    'bg-red-700 text-white shadow-sm hover:brightness-110',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-xs gap-1.5',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

const radiusStyles: Record<ButtonRadius, string> = {
  full: 'rounded-full',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      radius = 'full',
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-semibold transition-all',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          radiusStyles[radius],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : icon && iconPosition === 'left' ? (
          <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        ) : null}
        {children}
        {!loading && icon && iconPosition === 'right' ? (
          <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        ) : null}
      </button>
    );
  },
);

Button.displayName = 'Button';

/**
 * Icon-only button — small round button for toolbar actions.
 * Variants: default (gray-mid), danger (red), active (accent).
 */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger' | 'active';
  label: string;
}

const iconButtonVariants: Record<string, string> = {
  default:
    'text-gray-mid hover:bg-night-soft hover:text-paper',
  danger:
    'text-red-400 hover:bg-red-950/40',
  active:
    'text-accent hover:bg-night-soft',
};

export function IconButton({
  variant = 'default',
  label,
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        'inline-flex items-center justify-center rounded-full p-2 transition-colors',
        iconButtonVariants[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
