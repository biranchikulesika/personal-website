interface FieldNoteDividerProps {
  type: 'field-note' | 'written-from' | 'observed-at' | 'transit' | 'custom';
  value: string;
}

export function FieldNoteDivider({ type, value }: FieldNoteDividerProps) {
  let labelText = '';
  let emoji = '';

  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('platform') || lowerValue.includes('coast') || lowerValue.includes('beach') || lowerValue.includes('ocean')) {
    emoji = '🌊';
  } else if (lowerValue.includes('train') || lowerValue.includes('transit') || lowerValue.includes('rail') || lowerValue.includes('carriage') || lowerValue.includes('district') || lowerValue.includes('cuttack')) {
    emoji = '🚃';
  } else if (lowerValue.includes('bhubaneswar') || lowerValue.includes('study') || lowerValue.includes('lounge') || lowerValue.includes('town') || lowerValue.includes('puri')) {
    emoji = '📍';
  }

  switch (type) {
    case 'field-note':
      labelText = `FIELD NOTE: ${value}`;
      break;
    case 'written-from':
      labelText = `WRITTEN FROM: ${value}`;
      break;
    case 'observed-at':
      labelText = `OBSERVED AT: ${value}`;
      break;
    case 'transit':
      labelText = `EVENING TRANSIT: ${value}`;
      break;
    case 'custom':
    default:
      labelText = value;
      break;
  }

  // To match user's request:
  // "──────── [ 📍 Bhubaneswar ] ────────"
  // "──────── [ 🚃 Cuttack → Bhubaneswar ] ────────"
  // "──────── [ Evening Transit: District 8 → Central Terminal ] ────────"
  const formattedLabel = `[ ${emoji ? emoji + ' ' : ''}${labelText} ]`;

  return (
    <div id="field-note-divider" className="flex items-center w-full select-none my-12 overflow-hidden whitespace-nowrap">
      {/* Left Line - matches the exact page divider style */}
      <div className="h-px-border flex-1" />

      {/* Central Label - extremely understated, small, elegant, and low contrast warm accent */}
      <span className="font-spectral font-light italic text-center uppercase text-primary leading-none transition-all duration-300 min-w-0 max-w-[90%] shrink-0 text-[0.62rem] tracking-[0.22em] opacity-45 px-3">
        {formattedLabel}
      </span>

      {/* Right Line - matches the exact page divider style */}
      <div className="h-px bg-border flex-1" />
    </div>
  );
}
