const CRM_LOGOS = [
  { name: 'Salesforce', abbr: 'SF', color: '#00A1E0' },
  { name: 'HubSpot', abbr: 'HS', color: '#FF7A59' },
  { name: 'Pipedrive', abbr: 'PD', color: '#1A73E8' },
  { name: 'Dynamics', abbr: 'D365', color: '#0078D4' },
  { name: 'Zoho', abbr: 'ZH', color: '#E42527' },
  { name: 'Monday', abbr: 'MO', color: '#FF3D57' },
];

export function CrmLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {CRM_LOGOS.map((crm) => (
        <div
          key={crm.name}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.14] transition-colors"
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: crm.color }}
          >
            {crm.abbr.slice(0, 2)}
          </div>
          <span className="text-[13px] font-medium text-white/50">{crm.name}</span>
        </div>
      ))}
      <div className="px-3.5 py-2 rounded-lg border border-dashed border-white/[0.10] text-[13px] text-white/25">
        + autres
      </div>
    </div>
  );
}
