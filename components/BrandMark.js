export default function BrandMark({ className = '', label = 'Black Gold' }) {
  return (
    <svg
      aria-label={label}
      className={className}
      role="img"
      viewBox="40 14 140 170"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <path
        d="M58 22 44 54l3 38 11 26 16 28 22 22 14 10 14-10 22-22 16-28 11-26 3-38-14-32-32 30-20 12-20-12Z"
        fill="currentColor"
      />
      <path d="m110 66-18 18 6 2 12-12 12 12 6-2Z" fill="#09090b" />
      <path d="m56 90 39 10-7 11-30-10Zm108 0-39 10 7 11 30-10Zm-62 28h16l-8 12Z" fill="#09090b" />
      <path d="M97 140q17 3 32-9" fill="none" stroke="#09090b" strokeLinecap="round" strokeWidth="3.2" />
      <g fill="none" opacity=".42" stroke="#09090b" strokeWidth="1.8">
        <circle cx="74" cy="126" r="5.5" />
        <circle cx="146" cy="126" r="5.5" />
      </g>
      <g fill="#09090b" opacity=".42">
        <circle cx="74" cy="126" r="1.3" />
        <circle cx="146" cy="126" r="1.3" />
      </g>
    </svg>
  );
}
