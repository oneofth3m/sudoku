interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number, className: string | undefined, children: React.ReactNode) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconUndo({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ));
}

export function IconRedo({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </>
  ));
}

export function IconPencil({ size = 18, className }: IconProps) {
  return base(size, className, (
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
  ));
}

export function IconAlert({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ));
}

/** 2x2 grid — the corner-mark tool. */
export function IconCorners({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ));
}

/** Center dot — the center-mark tool. */
export function IconCenter({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </>
  ));
}

export function IconBackspace({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
      <path d="m18 9-6 6" />
      <path d="m12 9 6 6" />
    </>
  ));
}

export function IconLink({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ));
}

export function IconCopy({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ));
}

export function IconRefresh({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </>
  ));
}

export function IconClock({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ));
}

export function IconSteps({ size = 16, className }: IconProps) {
  return base(size, className, (
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  ));
}

export function IconTrophy({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21 1.18.54 2.03 2.03 2.03 3.79" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </>
  ));
}