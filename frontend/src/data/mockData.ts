import { Lead } from '../types';

export const initialLeads: Lead[] = [
  {
    id: 'lead-1',
    companyName: 'Apex Logistics Cloud',
    domain: 'apexlogistics.io',
    matchScore: 94,
    personaName: 'Sarah Chen',
    personaTitle: 'VP of Supply Chain Technology',
    personaEmail: 'sarah.chen@apexlogistics.io',
    personaInitials: 'SC',
    linkedinSignal: 'LinkedIn active 2d ago: discussing carrier invoice latency',
    hq: 'Chicago, IL',
    employees: '250-500 Employees',
    fundingStage: 'Series B: $42M',
    companySummary: 'B2B freight coordination platform managing over 120,000 monthly multi-modal shipments. Scaling carrier network across North America with acute legacy EDI protocol friction and billing backlogs.',
    recApi: 'Automated Freight Audit API',
    category: 'Supply Chain & Logistics',
    timeAgo: '12m ago',
    status: 'pending',
    detectedPain: {
      title: 'Detected Pain',
      code: 'EDI 210',
      description: 'Fragmented freight audit reconciliation causing 14-day invoice dispute lag and ~4.2% margin leakage.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'High Fit',
      description: 'Automated Carrier Reconciliation & Freight Audit API for real-time line-item rate verification.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'Press Log',
      description: 'Series B hiring notice highlighted immediate expansion for 12 carrier settlement agents; API replaces manual workflow.',
    },
    confidenceVectors: {
      painMatch: 96,
      buyerPersona: 92,
      stackMatch: 94,
    },
    coldEmail: {
      version: 'v1.2',
      tone: 'Executive Consultative',
      estimatedReadTime: '38s',
      activeVariant: 'crew',
      subject: "Resolving Apex's carrier invoice dispute latency before Q4 peak",
      body: `Hi Sarah,

Noticed Apex's recent expansion into refrigerated multi-modal freight — congratulations on the momentum.

Managing carrier settlement across 120k+ monthly loads usually creates a compounding invoice discrepancy backlog, especially when reconciling disparate EDI 210 feeds against rate cards. Most logistics scale-ups we speak with lose 3-5% margin to disputed detention and fuel surcharge claims.

We built an automated freight audit API that plugs into your existing TMS to validate line-item accessorials in under 2 seconds, eliminating carrier payment hold-ups.

Would you be open to a 10-minute walk-through next Tuesday at 2 PM CT to see how a peer carrier cut dispute resolution from 14 days down to 4 hours?

Best regards,
Alex Mercer
Director of Enterprise Solutions, Vanguard`,
      versions: [
        {
          id: 'v1',
          label: 'v1.0 (Initial Draft)',
          subject: "Freight audit delays at Apex Logistics",
          body: `Hi Sarah,\n\nI saw your freight volume is expanding. Vanguard provides an automated audit API for carrier invoices. Would you like to connect next week?\n\nAlex`,
          tone: 'Direct Outreach',
          words: 28,
          timestamp: '35m ago',
        },
        {
          id: 'v2',
          label: 'v1.2 (Executive Polish)',
          subject: "Resolving Apex's carrier invoice dispute latency before Q4 peak",
          body: `Hi Sarah,\n\nNoticed Apex's recent expansion into refrigerated multi-modal freight — congratulations on the momentum.\n\nManaging carrier settlement across 120k+ monthly loads usually creates a compounding invoice discrepancy backlog, especially when reconciling disparate EDI 210 feeds against rate cards. Most logistics scale-ups we speak with lose 3-5% margin to disputed detention and fuel surcharge claims.\n\nWe built an automated freight audit API that plugs into your existing TMS to validate line-item accessorials in under 2 seconds, eliminating carrier payment hold-ups.\n\nWould you be open to a 10-minute walk-through next Tuesday at 2 PM CT to see how a peer carrier cut dispute resolution from 14 days down to 4 hours?\n\nBest regards,\nAlex Mercer\nDirector of Enterprise Solutions, Vanguard`,
          tone: 'Executive Consultative',
          words: 128,
          timestamp: '12m ago',
        },
      ],
    },
  },
  {
    id: 'lead-2',
    companyName: 'Kestrel BioHealth',
    domain: 'kestrelbio.com',
    matchScore: 91,
    personaName: 'Dr. Marcus Vance',
    personaTitle: 'Chief Medical Officer',
    personaEmail: 'm.vance@kestrelbio.com',
    personaInitials: 'MV',
    linkedinSignal: 'Published article 4d ago on accelerating HIPAA compliance in decentralised trials',
    hq: 'Boston, MA',
    employees: '150-300 Employees',
    fundingStage: 'Series A: $24M',
    companySummary: 'Decentralized clinical trial platform accelerating Phase II immunology cohorts with encrypted telemetry streaming across 40+ medical centers.',
    recApi: 'HIPAA Clinical Data Pipeline',
    category: 'Healthcare & Bio',
    timeAgo: '34m ago',
    status: 'pending',
    detectedPain: {
      title: 'Detected Pain',
      code: 'HL7 FHIR',
      description: 'Manual verification of telemetry schemas creates a 21-day patient cohort onboarding bottleneck.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'High Fit',
      description: 'Automated HIPAA EHR ingestion gateway with zero-knowledge cryptographic provenance.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'FDA Filing',
      description: 'Recent 510(k) submission highlighted urgent requirement for real-time patient audit trails.',
    },
    confidenceVectors: {
      painMatch: 94,
      buyerPersona: 90,
      stackMatch: 88,
    },
    coldEmail: {
      version: 'v1.1',
      tone: 'Clinical Rigor',
      estimatedReadTime: '42s',
      activeVariant: 'crew',
      subject: "Accelerating Kestrel's Phase II cohort onboarding with automated FHIR ingestion",
      body: `Dr. Vance,

Your recent publication on decentralised trial telemetry highlighted the friction between rapid patient accrual and strict HIPAA audit trails.

When clinical teams ingest multi-site EHR records manually, cohort activation routinely stalls by 3-4 weeks due to non-standardized FHIR payloads.

Vanguard deployed an automated clinical pipeline API that normalizes multi-center HL7/FHIR feeds in under 500ms while maintaining verifiable cryptographic provenance. A peer biotech recently compressed their onboarding window from 21 days down to 48 hours.

Would you be open to a brief 12-minute technical briefing next Thursday morning?

Warm regards,
Alex Mercer
Enterprise Solutions, Vanguard`,
      versions: [],
    },
  },
  {
    id: 'lead-3',
    companyName: 'Strata FinTech',
    domain: 'stratafx.co',
    matchScore: 88,
    personaName: 'Elena Rostova',
    personaTitle: 'Head of Fraud Operations',
    personaEmail: 'elena@stratafx.co',
    personaInitials: 'ER',
    linkedinSignal: 'Spoke at Money20/20 panel on synthetic identity fraud in cross-border corridors',
    hq: 'New York, NY',
    employees: '500-1000 Employees',
    fundingStage: 'Series C: $85M',
    companySummary: 'Cross-border remittance rails routing $4B annual GMV across LatAm and Southeast Asia with high-speed compliance and sanctions filtering.',
    recApi: 'Real-Time Risk Verification',
    category: 'Fintech & SaaS',
    timeAgo: '1h ago',
    status: 'pending',
    detectedPain: {
      title: 'Detected Pain',
      code: 'KYC / AML',
      description: 'False positive rates at 8.4% causing $1.2M annual compliance analyst overtime cost.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'High Fit',
      description: 'Sub-second Synthetic Identity Graph API with automated suspicious transaction report compilation.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'FinCEN Advisory',
      description: 'New corridor regulatory mandate requires real-time graph traversal before transaction release.',
    },
    confidenceVectors: {
      painMatch: 89,
      buyerPersona: 91,
      stackMatch: 85,
    },
    coldEmail: {
      version: 'v1.0',
      tone: 'Fintech Risk Advisory',
      estimatedReadTime: '35s',
      activeVariant: 'crew',
      subject: "Slashing Strata's cross-border KYC false positives by 60%",
      body: `Hi Elena,

Caught your panel remarks on synthetic identity surges across newly opened remittance corridors.

When transaction velocity scales past 20k daily transfers, legacy rules-based fraud engines typically trigger an 8-10% false positive spike — tying up your best risk analysts in manual reviews while customers churn.

Vanguard's Real-Time Risk API conducts bi-directional behavioral graph checks in 38ms, cutting false positive flags by 64% without increasing fraud loss exposure.

Could I share our benchmark paper and 2-minute API benchmark this Wednesday?

Best,
Alex Mercer
Vanguard Enterprise`,
      versions: [],
    },
  },
  {
    id: 'lead-4',
    companyName: 'OmniRetail Global',
    domain: 'omniretail.eu',
    matchScore: 86,
    personaName: 'David Thorne',
    personaTitle: 'Director of E-Commerce',
    personaEmail: 'david.thorne@omniretail.eu',
    personaInitials: 'DT',
    linkedinSignal: 'Announced launch of multi-marketplace omnichannel expansion across 6 EU hubs',
    hq: 'Amsterdam, NL',
    employees: '1000+ Employees',
    fundingStage: 'Public / Enterprise',
    companySummary: 'Pan-European consumer electronics brand managing 85,000 SKUs across 14 direct-to-consumer and marketplace storefronts.',
    recApi: 'Dynamic Catalog Inventory Sync',
    category: 'Retail & E-commerce',
    timeAgo: '2h ago',
    status: 'pending',
    detectedPain: {
      title: 'Detected Pain',
      code: 'ERP Sync',
      description: 'Inventory buffer lag between SAP and Shopify Plus causing 3.1% overselling rate during peak promotions.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'Medium Fit',
      description: 'Event-driven multi-warehouse inventory webhook mesh with guaranteed sub-second delivery.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'Tech Job Board',
      description: 'Active openings for 5 ERP Integration Engineers indicating modernization initiative.',
    },
    confidenceVectors: {
      painMatch: 86,
      buyerPersona: 85,
      stackMatch: 88,
    },
    coldEmail: {
      version: 'v1.0',
      tone: 'Executive Consultative',
      estimatedReadTime: '32s',
      activeVariant: 'crew',
      subject: "Preventing stockout disputes across OmniRetail's marketplace storefronts",
      body: `Hi David,

Congratulations on the European marketplace expansion.

Managing 85k+ active SKUs across distributed warehouses usually strains the batch sync loop between SAP and external storefronts, creating overselling incidents during heavy flash sales.

We engineered an event-driven catalog sync API that synchronizes inventory allocations across all 14 storefronts within 400 milliseconds of any order event.

Are you available for a 10-minute demo next Tuesday afternoon to inspect our ERP connector latency?

Best regards,
Alex Mercer
Vanguard`,
      versions: [],
    },
  },
  {
    id: 'lead-5',
    companyName: 'Novus Energy AI',
    domain: 'novusgrid.tech',
    matchScore: 82,
    personaName: 'Julian Ramos',
    personaTitle: 'VP Grid Analytics',
    personaEmail: 'j.ramos@novusgrid.tech',
    personaInitials: 'JR',
    linkedinSignal: 'Reposted IEEE paper on micro-grid load forecasting in ERCOT territory',
    hq: 'Austin, TX',
    employees: '100-250 Employees',
    fundingStage: 'Series A: $18M',
    companySummary: 'Intelligent distributed grid software forecasting residential battery discharge and solar storage capacity for municipal utility operators.',
    recApi: 'Smart Meter Ingestion Engine',
    category: 'Energy AI',
    timeAgo: '3h ago',
    status: 'pending',
    detectedPain: {
      title: 'Detected Pain',
      code: 'SCADA AMI',
      description: 'Unprocessed smart meter telemetry drops during extreme weather pricing spikes.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'Medium Fit',
      description: 'High-throughput time-series streaming gateway processing 500k events/sec with zero packet drop.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'ERCOT Notice',
      description: 'New utility integration standards requiring 15-minute settlement intervals by Q1.',
    },
    confidenceVectors: {
      painMatch: 84,
      buyerPersona: 80,
      stackMatch: 83,
    },
    coldEmail: {
      version: 'v1.0',
      tone: 'Engineering Direct',
      estimatedReadTime: '30s',
      activeVariant: 'crew',
      subject: "Handling ERCOT's 15-minute telemetry mandate at Novus",
      body: `Julian,

Saw your commentary on microgrid load forecasting resilience ahead of winter pricing volatility.

With the upcoming 15-minute telemetry intervals, standard AMI ingest nodes frequently encounter Kafka cluster backpressure when processing concurrent residential solar storage bursts.

Vanguard's Time-Series Stream Engine buffers and ingests over 500k smart meter telemetry events per second with zero drop rates.

Would you be open to reviewing our benchmark telemetry pipeline architecture this week?

Cheers,
Alex Mercer
Vanguard`,
      versions: [],
    },
  },
  {
    id: 'lead-6',
    companyName: 'CipherSecure Labs',
    domain: 'cipherlabs.io',
    matchScore: 95,
    personaName: 'Tanya Sterling',
    personaTitle: 'VP Security Architecture',
    personaEmail: 'tanya.s@cipherlabs.io',
    personaInitials: 'TS',
    linkedinSignal: 'Authored CISO playbook on zero-trust API credential rotation',
    hq: 'San Francisco, CA',
    employees: '300-600 Employees',
    fundingStage: 'Series B: $50M',
    companySummary: 'Enterprise identity security and secret management platform guarding Kubernetes clusters across Fortune 500 banking clients.',
    recApi: 'Automated Key Provenance API',
    category: 'Fintech & SaaS',
    timeAgo: '4h ago',
    status: 'pending',
    detectedPain: {
      title: 'Detected Pain',
      code: 'SOC 2 Type II',
      description: 'Manual key rotation audits consume 120 hours of senior architect time per quarterly cycle.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'High Fit',
      description: 'Continuous Cryptographic Secret Auditing API with automatic CI/CD vulnerability quarantine.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'GitHub Advisory',
      description: 'Public repo security policy update indicated upcoming enforcement of ephemeral token lifetimes.',
    },
    confidenceVectors: {
      painMatch: 97,
      buyerPersona: 95,
      stackMatch: 93,
    },
    coldEmail: {
      version: 'v1.0',
      tone: 'Technical Executive',
      estimatedReadTime: '35s',
      activeVariant: 'crew',
      subject: "Eliminating quarterly credential rotation toil for CipherSecure's SecOps",
      body: `Hi Tanya,

Your recent breakdown on automated credential rotation for multi-cloud Kubernetes clusters was spot on.

As clusters scale past 500 microservices, manual credential verification turns into an unmanageable compliance fire drill that pulls senior architects away from product delivery.

Vanguard's Secret Auditing API automates ephemeral token lifecycle verification with automated evidence generation for SOC 2 Type II controls.

Would you be open to a 10-minute briefing next Thursday?

Best,
Alex Mercer
Vanguard`,
      versions: [],
    },
  },
  {
    id: 'lead-7',
    companyName: 'QuantumFleet Dynamics',
    domain: 'quantumfleet.ai',
    matchScore: 89,
    personaName: 'Liam O’Connor',
    personaTitle: 'Chief Operating Officer',
    personaEmail: 'liam@quantumfleet.ai',
    personaInitials: 'LO',
    linkedinSignal: 'Shared milestone on reaching 15,000 telematics-connected commercial delivery vans',
    hq: 'Dallas, TX',
    employees: '200-400 Employees',
    fundingStage: 'Series B: $35M',
    companySummary: 'Fleet electrification and dynamic route optimization software powering last-mile parcel couriers across the Sunbelt.',
    recApi: 'Dynamic Dispatch & Charging Engine',
    category: 'Supply Chain & Logistics',
    timeAgo: '5h ago',
    status: 'pending',
    detectedPain: {
      title: 'Detected Pain',
      code: 'EV Peak TOU',
      description: 'Unmanaged depot charging causing $45k/month utility demand penalties across three major hubs.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'High Fit',
      description: 'Peak-shaving Smart Depot Charging API synced to regional wholesale energy pricing.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'Fleet Press Release',
      description: 'Announced 200 new heavy EV van additions arriving in Q4.',
    },
    confidenceVectors: {
      painMatch: 92,
      buyerPersona: 88,
      stackMatch: 87,
    },
    coldEmail: {
      version: 'v1.0',
      tone: 'Executive Consultative',
      estimatedReadTime: '36s',
      activeVariant: 'crew',
      subject: "Eliminating peak TOU demand surcharges across Quantum's EV depots",
      body: `Liam,

Congratulations on crossing 15k connected vehicles — great momentum across the Sunbelt expansion.

When scaling commercial EV fleets past 100 vans per depot, uncoordinated overnight charging routinely triggers severe utility demand surcharges that eat into last-mile unit economics.

Vanguard's Smart Depot Charging API syncs vehicle arrival state-of-charge with real-time wholesale TOU pricing to eliminate demand spikes automatically.

Could we schedule 10 minutes next Wednesday to walk through our depot energy cost savings model?

Regards,
Alex Mercer
Vanguard Enterprise`,
      versions: [],
    },
  },
];

export const initialApprovedLeads: Lead[] = [
  {
    id: 'lead-app-1',
    companyName: 'SkyFreight Logistics',
    domain: 'skyfreight.com',
    matchScore: 96,
    personaName: 'Robert Lang',
    personaTitle: 'VP Operations',
    personaEmail: 'robert@skyfreight.com',
    personaInitials: 'RL',
    linkedinSignal: 'Active yesterday',
    hq: 'Atlanta, GA',
    employees: '1,200 Employees',
    fundingStage: 'Series C',
    companySummary: 'Global air freight forwarder handling 450k cargo flights annually.',
    recApi: 'Automated Customs Valuation API',
    category: 'Supply Chain & Logistics',
    timeAgo: 'Yesterday',
    status: 'approved',
    approvedAt: 'Today at 08:30 AM',
    dispatchedSequence: 'Q4 Enterprise Inbound v2 - Step 1',
    detectedPain: {
      title: 'Detected Pain',
      code: 'CBP ACE',
      description: 'Customs declaration discrepancies stalling ground clearance by 48 hours.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'High Fit',
      description: 'Customs Declaration Auto-Harmonization API.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'Logistics Journal',
      description: 'Air freight capacity up 32% YoY.',
    },
    confidenceVectors: {
      painMatch: 97,
      buyerPersona: 95,
      stackMatch: 96,
    },
    coldEmail: {
      version: 'v1.2',
      tone: 'Executive Consultative',
      estimatedReadTime: '32s',
      activeVariant: 'crew',
      subject: "Cutting SkyFreight's customs clearance hold-ups before Q4 surge",
      body: 'Hi Robert, saw the air freight volume surge...',
      versions: [],
    },
  },
  {
    id: 'lead-app-2',
    companyName: 'Veritas Medical Data',
    domain: 'veritasmed.org',
    matchScore: 93,
    personaName: 'Claire Beauchamp',
    personaTitle: 'Chief Compliance Officer',
    personaEmail: 'claire@veritasmed.org',
    personaInitials: 'CB',
    linkedinSignal: 'Active 3d ago',
    hq: 'Philadelphia, PA',
    employees: '400 Employees',
    fundingStage: 'Series B',
    companySummary: 'Clinical data repository for regional hospital systems.',
    recApi: 'EHR De-identification Engine',
    category: 'Healthcare & Bio',
    timeAgo: '2d ago',
    status: 'approved',
    approvedAt: 'Yesterday at 04:15 PM',
    dispatchedSequence: 'Healthcare Pioneer Outbound - Step 1',
    detectedPain: {
      title: 'Detected Pain',
      code: 'Safe Harbor',
      description: '18-identifier stripping backlog holding up research grants.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'High Fit',
      description: 'AI-assisted PHI redaction gateway.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'NIH Grant',
      description: 'Awarded $14M multi-institution research partnership.',
    },
    confidenceVectors: {
      painMatch: 94,
      buyerPersona: 92,
      stackMatch: 93,
    },
    coldEmail: {
      version: 'v1.1',
      tone: 'Clinical Rigor',
      estimatedReadTime: '34s',
      activeVariant: 'crew',
      subject: "Automating Veritas's Safe Harbor PHI scrubbing for NIH trials",
      body: 'Dear Claire, congratulations on the NIH research award...',
      versions: [],
    },
  },
];

export const initialRejectedLeads: Lead[] = [
  {
    id: 'lead-rej-1',
    companyName: 'Vortex Cloud Storage',
    domain: 'vortexcloud.io',
    matchScore: 68,
    personaName: 'Gary Miller',
    personaTitle: 'Junior IT Coordinator',
    personaEmail: 'gary@vortexcloud.io',
    personaInitials: 'GM',
    linkedinSignal: 'Not active',
    hq: 'Seattle, WA',
    employees: '50 Employees',
    fundingStage: 'Seed',
    companySummary: 'S3-compatible cold object storage provider.',
    recApi: 'Tiered Storage Optimizer',
    category: 'Fintech & SaaS',
    timeAgo: '1d ago',
    status: 'rejected',
    rejectionReason: 'Wrong persona authority (Junior coordinator without purchasing budget)',
    detectedPain: {
      title: 'Detected Pain',
      code: 'Egress',
      description: 'High AWS cross-region egress fees.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'Low Fit',
      description: 'Egress rate cache proxy.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'Hacker News',
      description: 'Small seed launch announcement.',
    },
    confidenceVectors: {
      painMatch: 70,
      buyerPersona: 62,
      stackMatch: 72,
    },
    coldEmail: {
      version: 'v1.0',
      tone: 'Direct Outreach',
      estimatedReadTime: '25s',
      activeVariant: 'crew',
      subject: 'Lowering egress fees at Vortex Cloud',
      body: 'Hi Gary...',
      versions: [],
    },
  },
  {
    id: 'lead-rej-2',
    companyName: 'Beacon Micro Retail',
    domain: 'beaconmicro.shop',
    matchScore: 71,
    personaName: 'Maya Patel',
    personaTitle: 'Store Manager',
    personaEmail: 'maya@beaconmicro.shop',
    personaInitials: 'MP',
    linkedinSignal: 'Active 2w ago',
    hq: 'Denver, CO',
    employees: '15 Employees',
    fundingStage: 'Bootstrapped',
    companySummary: 'Boutique single-store apparel shop.',
    recApi: 'Dynamic Catalog Sync',
    category: 'Retail & E-commerce',
    timeAgo: '2d ago',
    status: 'rejected',
    rejectionReason: 'Company under minimum scale threshold (<50 employees)',
    detectedPain: {
      title: 'Detected Pain',
      code: 'POS',
      description: 'Square POS manual price updates.',
    },
    recommendedPitch: {
      title: 'Recommended Service',
      fitLevel: 'Low Fit',
      description: 'Catalog Sync.',
    },
    crewAiSignal: {
      title: 'AI Sales Signal',
      source: 'Local Directory',
      description: 'Opened second pop-up location.',
    },
    confidenceVectors: {
      painMatch: 72,
      buyerPersona: 68,
      stackMatch: 73,
    },
    coldEmail: {
      version: 'v1.0',
      tone: 'Casual',
      estimatedReadTime: '20s',
      activeVariant: 'crew',
      subject: 'Automating Beacon inventory',
      body: 'Hi Maya...',
      versions: [],
    },
  },
];
