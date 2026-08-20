import type { Persona } from '@/lib/types';

/** Display labels for the four persona types. */
export const PERSONA_LABELS: Record<Persona, string> = {
  builder: 'Builder',
  operator: 'Operator',
  thinker: 'Thinker',
  wanderer: 'Wanderer',
};

/** All personas as an ordered array for iteration. */
export const ALL_PERSONAS: Persona[] = [
  'builder',
  'operator',
  'thinker',
  'wanderer',
];
