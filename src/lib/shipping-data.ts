// src/lib/shipping-data.ts

export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
}

export interface ComplianceRule {
  from: string; // Country code
  to: string; // Country code
  plantSpecies: string[]; // List of scientific names this rule applies to, or 'ALL'
  pcRequired: boolean;
  citesRequired: boolean;
  ipRequired: boolean;
  pcInfo: {
    nppoName: string;
    applicationLink: string;
    notes: string;
  };
  citesInfo: {
    appendix: 'I' | 'II' | 'III';
    exportAuthorityLink: string;
    importAuthorityLink: string;
    notes: string;
  };
  ipInfo: {
    agencyName: string;
    applicationLink: string;
    notes: string;
  };
  customsInfo: {
    notes: string;
  };
  prohibitions?: {
    isProhibited: boolean;
    reason: string;
  };
}

export const countryList: Country[] = [
  { name: 'United States', code: 'US' },
  { name: 'Canada', code: 'CA' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'Australia', code: 'AU' },
  { name: 'Japan', code: 'JP' },
  // Add more countries as needed
];

// This is your mock database. Add more rules here.
const complianceRules: ComplianceRule[] = [
  {
    from: 'US',
    to: 'CA',
    plantSpecies: ['Monstera deliciosa', 'Ficus lyrata'],
    pcRequired: true,
    citesRequired: false,
    ipRequired: false,
    pcInfo: {
      nppoName: 'USDA APHIS (Animal and Plant Health Inspection Service)',
      applicationLink: 'https://www.aphis.usda.gov/aphis/ourfocus/planthealth/sa_export/sa_ephyto',
      notes: 'Phytosanitary certificates are generally required for all live plants entering Canada from the US. Apply online via the ePhyto system.',
    },
    citesInfo: {
      appendix: 'II',
      exportAuthorityLink: '',
      importAuthorityLink: '',
      notes: 'Not applicable for Monstera deliciosa.',
    },
    ipInfo: {
      agencyName: '',
      applicationLink: '',
      notes: 'Import Permit generally not required for personal shipments of common houseplants from the US.',
    },
    customsInfo: {
      notes: 'A standard customs declaration (e.g., CN22/CN23) is required. Clearly state the scientific name and value of the plant.',
    },
  },
  {
    from: 'US',
    to: 'CA',
    plantSpecies: ['ALL_CITES_APPENDIX_I'], // Example for a highly regulated plant
    pcRequired: true,
    citesRequired: true,
    ipRequired: true,
    pcInfo: {
      nppoName: 'USDA APHIS',
      applicationLink: 'https://www.aphis.usda.gov/aphis/ourfocus/planthealth/sa_export/sa_ephyto',
      notes: 'A Phytosanitary Certificate is mandatory.',
    },
    citesInfo: {
      appendix: 'I',
      exportAuthorityLink: 'https://www.fws.gov/service/permits/apply-cites-permit',
      importAuthorityLink: 'https://www.canada.ca/en/environment-climate-change/services/convention-international-trade-endangered-species/permits.html',
      notes: 'CITES Appendix I plants require BOTH an export permit from the US Fish and Wildlife Service and an import permit from the Canadian CITES Management Authority BEFORE shipping. This process is lengthy and strict.',
    },
    ipInfo: {
        agencyName: 'Canadian Food Inspection Agency (CFIA)',
        applicationLink: 'https://inspection.canada.ca/plant-health/importing-plants/eng/1300938482077/1300938555021',
        notes: 'An Import Permit is required for most CITES-listed species, in addition to CITES permits.',
    },
    customsInfo: {
        notes: 'Customs declaration must include copies of all permits (PC, CITES Export, CITES Import). Failure to declare properly can result in seizure and fines.',
    },
  },
  // Add more rules for other country pairs and plants here...
];

export const getComplianceRequirements = (
  from: string,
  to: string,
  plant: string
): ComplianceRule | undefined => {
  const specificRule = complianceRules.find(
    (rule) =>
      rule.from === from &&
      rule.to === to &&
      rule.plantSpecies.includes(plant)
  );
  if (specificRule) return specificRule;

  // Fallback to a generic rule if one exists (e.g., for CITES plants)
  const genericRule = complianceRules.find(
    (rule) =>
        rule.from === from &&
        rule.to === to &&
        rule.plantSpecies.includes('ALL') // A placeholder for a generic rule
  );
  return genericRule;
};
