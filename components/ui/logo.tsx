export function Logo() {
  return (
    <span className="font-sans font-bold tracking-widest flex items-center text-current leading-none">
      <span className="uppercase">BIRANCH</span>
      <span className="relative inline-flex flex-col items-center">
        {/* Transparent uppercase I for exact height reference */}
        <span className="text-transparent">I</span>
        {/* Dotless i sitting at the bottom */}
        <span className="absolute bottom-0 text-current">ı</span>
        {/* Dot sitting at the top, shifted slightly left and downward */}
        <span className="absolute top-[0.04em] left-[35%] -translate-x-[50%] w-[0.18em] h-[0.18em] rounded-full bg-amber-600 dark:bg-amber-400" />
      </span>
    </span>
  );
}
