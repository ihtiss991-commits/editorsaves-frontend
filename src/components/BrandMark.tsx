type BrandMarkProps = {
  id: string;
  className?: string;
};

export default function BrandMark({ id, className }: BrandMarkProps) {
  const gradientId = `editor-mark-${id}`;
  return (
    <svg aria-hidden="true" viewBox="0 0 42 42" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#16a34a" />
          <stop offset="0.55" stopColor="#22c55e" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="38" height="38" rx="12" fill={`url(#${gradientId})`} />
      <path d="M12 13.5h18v4H16v3h11v4H16v4h14v4H12z" fill="white" opacity=".98" />
    </svg>
  );
}
