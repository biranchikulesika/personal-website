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
        className={`flex items-center justify-center border-r border-tinted/25 bg-tinted/20 px-1.5 py-0.5 ${config.iconText} sm:py-1`}
      >
        <PersonaIcon persona={key} className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
      </span>
      <span className="px-2 py-0.5 font-medium text-paper">
        {label}
      </span>
    </div>
  );
}
