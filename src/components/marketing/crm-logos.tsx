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
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {CRM_LOGOS.map((crm) => (
        <div
          key={crm.name}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: crm.color }}
          >
            {crm.abbr.slice(0, 2)}
          </div>
          <span className="text-sm font-medium text-slate-700">{crm.name}</span>
        </div>
      ))}
      <div className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
        + tous les autres CRM
      </div>
    </div>
  );
}
