export interface PersonaTheme {
  primaryColor: string;
  accentColor: string;
  hoverColor: string;
  borderColor: string;
  iconBgColor: string;
  
  // Font classes
  titleFont: string;
  bodyFont: string;
  metaFont: string;
  
  // Wording / Labels
  archiveTitle: string;
  archiveSubtitle: string;
  homeTitle: string;
  homeSubtitle: string;
  seeAllText: string;
  searchText: string;
  readBtnText: string;
  recentTitle: string;
  stripTitle: string;
  stripLinkText: string;
  
  // Outer theme container styles
  containerClass: string;
}

export const PERSONA_BLOG_THEMES: Record<string, PersonaTheme> = {
  wanderer: {
    primaryColor: 'text-foreground',
    accentColor: 'text-primary',
    hoverColor: 'hover:text-foreground/80',
    borderColor: 'border-border',
    iconBgColor: 'bg-muted',
    titleFont: 'font-serif tracking-tight',
    bodyFont: 'font-sans',
    metaFont: 'font-sans text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary',
    archiveTitle: 'Inside The Head Archive',
    archiveSubtitle: 'Archive of dispatches, raw thoughts, and quiet observations.',
    homeTitle: 'Inside The Head',
    homeSubtitle: 'Raw thoughts. Bitter truths. Sharp questions.',
    seeAllText: 'View Full Archive',
    searchText: 'Search dispatches...',
    readBtnText: 'Read Essay',
    recentTitle: 'Latest Publications',
    stripTitle: 'From The Archive',
    stripLinkText: 'OPEN NOTEBOOK',
    containerClass: 'bg-background text-foreground transition-colors duration-500'
  },
  thinker: {
    primaryColor: 'text-foreground',
    accentColor: 'text-primary',
    hoverColor: 'hover:text-foreground/80',
    borderColor: 'border-border',
    iconBgColor: 'bg-muted',
    titleFont: 'font-cormorant',
    bodyFont: 'font-sans',
    metaFont: 'font-mono text-[9.5px] uppercase tracking-[0.25em] text-primary',
    archiveTitle: 'Evolving Synapses',
    archiveSubtitle: 'Structured inquiries, reflections, and essays in chronological order.',
    homeTitle: 'Reflective Intellect',
    homeSubtitle: 'Sinking under instant consensus to find conscience, tracing solitude sanctuary against noise economy.',
    seeAllText: 'View Full Archive',
    searchText: 'Search ideas...',
    readBtnText: 'Inspect Dialogues',
    recentTitle: 'Active Reflections',
    stripTitle: 'From The Archive',
    stripLinkText: 'OPEN ARCHIVE',
    containerClass: 'bg-background text-foreground transition-colors duration-500'
  },
  builder: {
    primaryColor: 'text-foreground',
    accentColor: 'text-primary',
    hoverColor: 'hover:text-foreground/80',
    borderColor: 'border-border',
    iconBgColor: 'bg-muted',
    titleFont: 'font-sans font-semibold tracking-tight',
    bodyFont: 'font-sans',
    metaFont: 'text-primary text-[9.5px] uppercase tracking-widest font-mono',
    archiveTitle: 'The Forge Catalogue',
    archiveSubtitle: 'Releases, blueprints, and system summaries.',
    homeTitle: 'Blueprint Dispatches',
    homeSubtitle: 'Bedrock solutions, deliberate design friction, native parsing compiler strategies, and modular interfaces.',
    seeAllText: 'View Full Archive',
    searchText: 'Search builds...',
    readBtnText: 'Inspect Blueprint',
    recentTitle: 'Modular Build Specs',
    stripTitle: 'From The Archive',
    stripLinkText: 'OPEN LOGBOOK',
    containerClass: 'bg-background text-foreground transition-colors duration-500'
  },
  operator: {
    primaryColor: 'text-foreground',
    accentColor: 'text-primary',
    hoverColor: 'hover:text-foreground/80 transition-opacity',
    borderColor: 'border-border',
    iconBgColor: 'bg-muted',
    titleFont: 'font-mono uppercase font-bold',
    bodyFont: 'font-mono',
    metaFont: 'font-mono text-[10px] uppercase tracking-widest text-primary',
    archiveTitle: 'INDEX_SYS_HIST',
    archiveSubtitle: 'Telemetry records, incident logs, and signal history.',
    homeTitle: 'Telemetry Feed',
    homeSubtitle: 'Tracking clock drift parameters, configuration deviations, integrity alerts, and background indices.',
    seeAllText: 'QUERY_ALL',
    searchText: 'Search signals...',
    readBtnText: '[HEX_STREAM_DECODE]',
    recentTitle: 'Active Signals Log',
    stripTitle: 'From Records',
    stripLinkText: 'OPEN RECORDS',
    containerClass: 'bg-background text-foreground transition-colors duration-500'
  },
  main: {
    primaryColor: 'text-foreground',
    accentColor: 'text-primary',
    hoverColor: 'hover:text-foreground/80',
    borderColor: 'border-border',
    iconBgColor: 'bg-muted',
    titleFont: 'font-serif tracking-tight',
    bodyFont: 'font-sans',
    metaFont: 'font-mono text-[9.5px] uppercase tracking-widest text-primary',
    archiveTitle: 'Ecosystem Chronicles',
    archiveSubtitle: 'All dispatches across Forge, Signal, Scribble, and Inside The Head.',
    homeTitle: 'Ecosystem Logs',
    homeSubtitle: 'Blueprints, signals, dialectics, and scribbles. The collective intelligence network.',
    seeAllText: 'View Full Archive',
    searchText: 'Search all dispatches...',
    readBtnText: 'Read Dispatch',
    recentTitle: 'Consolidated Stream',
    stripTitle: 'From The Archive',
    stripLinkText: 'OPEN UNIFIED FEED',
    containerClass: 'bg-background text-foreground transition-colors duration-500'
  }
};
