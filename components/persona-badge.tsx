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
}

export function PersonaBadge({ persona, className = '' }: PersonaBadgeProps) {
  if (!persona) return null;
  const key = persona.toLowerCase() as Persona;
  const config = PERSONA_STYLES[key] ?? {
    iconText: 'text-ink-soft',
    title: `Persona · ${persona}`,
  };

  const label = PERSONA_LABELS[key] ?? persona;

  return (
    <div
      className={`inline-flex shrink-0 items-center overflow-hidden rounded-md border border-tinted/30 bg-night-soft/60 text-[11px] font-mono transition-colors duration-200 hover:border-tinted/50 sm:text-xs ${className}`}
      title={config.title}
    >
      <span
        className={`flex items-center justify-center self-stretch pl-2 pr-1.5 bg-transparent border-r-0 sm:border-r sm:border-tinted/25 sm:bg-tinted/20 sm:px-1.5 sm:py-1 ${config.iconText}`}
      >
        <PersonaIcon persona={key} className="h-3 w-3 shrink-0" />
      </span>
      <span className="py-0.5 pr-2 pl-0 sm:px-2 font-medium text-paper">
        {label}
      </span>
    </div>
  );
}
