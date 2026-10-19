export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-ink-950 text-lg tracking-tight">
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="size-7 text-brand-600"
        fill="currentColor"
      >
        <rect width="32" height="32" rx="8" />
        <path d="M13 10.5v11l9-5.5-9-5.5Z" fill="white" />
      </svg>
      Koalaflow
    </span>
  );
}
