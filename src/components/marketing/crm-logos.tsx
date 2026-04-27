const CRM_LOGOS = [
  { name: 'Salesforce', abbr: 'SF', color: '#00A1E0' },
  { name: 'HubSpot',    abbr: 'HS', color: '#FF7A59' },
  { name: 'Pipedrive',  abbr: 'PD', color: '#1A73E8' },
  { name: 'Dynamics',   abbr: 'D3', color: '#0078D4' },
  { name: 'Zoho CRM',   abbr: 'ZH', color: '#E42527' },
  { name: 'Monday',     abbr: 'MO', color: '#FF3D57' },
];

export function CrmLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {CRM_LOGOS.map((crm) => (
        <div
          key={crm.name}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ background: crm.color, borderRadius: 4 }}
          >
            {crm.abbr}
          </div>
          <span className="text-[13px] font-medium text-slate-600">{crm.name}</span>
        </div>
      ))}
      <div className="px-3 py-2 bg-white rounded-lg border border-dashed border-slate-300 text-[13px] text-slate-400">
        + autres
      </div>
    </div>
  );
}
