const CRM_LOGOS = [
  { name: 'Salesforce', abbr: 'SF' },
  { name: 'HubSpot', abbr: 'HS' },
  { name: 'Pipedrive', abbr: 'PD' },
  { name: 'Dynamics 365', abbr: 'D3' },
  { name: 'Zoho', abbr: 'ZH' },
  { name: 'Monday', abbr: 'MO' },
];

export function CrmLogos() {
  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10"
        style={{
          background: 'linear-gradient(to right, #F4EFE6, transparent)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10"
        style={{
          background: 'linear-gradient(to left, #F4EFE6, transparent)',
        }}
      />

      <div className="flex items-center gap-10 sm:gap-16 justify-center flex-wrap py-2">
        {CRM_LOGOS.map((crm, i) => (
          <div
            key={crm.name}
            className="flex items-baseline gap-2.5 group"
          >
            <span
              className="text-[10px] tabular-nums"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(26, 21, 16, 0.35)',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className="text-[19px] sm:text-[22px] group-hover:italic transition-all"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: 'rgba(26, 21, 16, 0.7)',
              }}
            >
              {crm.name}
            </span>
          </div>
        ))}
        <span
          className="text-[13px] italic"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'rgba(26, 21, 16, 0.4)',
          }}
        >
          + autres via API
        </span>
      </div>
    </div>
  );
}
