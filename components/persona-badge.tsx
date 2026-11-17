import type { Persona } from '@/lib/types';
import { PERSONA_LABELS } from '@/lib/constants';
import { PersonaIcon } from './icons';

interface PersonaStyleConfig {
  iconText: string;
  title: string;
}

export const PERSONA_STYLES: Record<Persona, PersonaStyleConfig> = {
  builder: {
    iconText: 'text-teal',
    title: 'Builder · Software, Code & Architecture',
  },
  operator: {
    iconText: 'text-accent-green',
    title: 'Operator · Ethical Hacking & Cybersecurity',
  },
  thinker: {
    iconText: 'text-accent',
    title: 'Thinker · Philosophy, Ideas & Deep Thinking',
  },
  wanderer: {
    iconText: 'text-gray-mid',
    title: 'Wanderer · Vlogs, Travel & Personal Stories',
  },
};

interface PersonaBadgeProps {
  persona?: Persona | string | null;
  className?: string;
  showIcon?: boolean;
}

export function PersonaBadge({
  persona,
  className = '',
  showIcon = true,
}: PersonaBadgeProps) {
  if (!persona) return null;
  const key = persona.toLowerCase() as Persona;
  const config = PERSONA_STYLES[key] ?? {
    iconText: 'text-ink-soft',
    title: `Persona · ${persona}`,
  };

  const label = PERSONA_LABELS[key] ?? persona;

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap overflow-hidden rounded-md border border-tinted/30 bg-night-soft/60 px-2 py-0.5 font-mono text-[11px] font-medium text-paper transition-colors duration-200 hover:border-tinted/50 sm:text-xs ${className}`}
      title={config.title}
    >
      {showIcon && (
        <span
          className={`mr-1.5 flex items-center justify-center shrink-0 ${config.iconText}`}
        >
          <PersonaIcon persona={key} className="h-3 w-3 shrink-0" />
        </span>
      )}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}
