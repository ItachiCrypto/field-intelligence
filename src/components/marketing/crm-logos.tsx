const CRM_LOGOS = [
  { name: 'Salesforce', abbr: 'SF', color: '#00A1E0' },
  { name: 'HubSpot', abbr: 'HS', color: '#FF7A59' },
  { name: 'Pipedrive', abbr: 'PD', color: '#1A73E8' },
  { name: 'Dynamics', abbr: 'D3', color: '#0078D4' },
  { name: 'Zoho CRM', abbr: 'ZH', color: '#E42527' },
  { name: 'Monday', abbr: 'MO', color: '#FF3D57' },
];

export function CrmLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {CRM_LOGOS.map((crm) => (
        <div
          key={crm.name}
          className="flex items-center gap-2.5 px-3.5 py-2 transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '8px',
          }}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ background: crm.color, borderRadius: '4px' }}
          >
            {crm.abbr}
          </div>
          <span className="text-[13px] font-medium text-white/40">{crm.name}</span>
        </div>
      ))}
      <div
        className="px-3.5 py-2 text-[13px] text-white/20"
        style={{
          border: '1px dashed rgba(255,255,255,0.09)',
          borderRadius: '8px',
        }}
      >
        + autres
      </div>
    </div>
  );
}
