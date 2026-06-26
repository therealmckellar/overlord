/**
 * Loop Pattern Templates
 * Pre-built loop configurations based on the Loop Engineering framework.
 * Maps patterns from cobusgreyling/loop-engineering to our business lanes.
 */

export type Cadence = '15m' | '30m' | '1h' | '2h' | '6h' | '1d' | '1w';
export type ReadinessLevel = 'L1' | 'L2' | 'L3';
export type BusinessLane = 'david' | 'josh' | 'steve' | 'fathom' | 'shared';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface LoopPattern {
  id: string;
  name: string;
  description: string;
  lane: BusinessLane;
  cadence: Cadence;
  maxIterations: number;
  prompt: string;
  estimatedTokensPerIteration: number;
  readinessLevel: ReadinessLevel;
  riskLevel: RiskLevel;
  requiresSubAgents: boolean;
  requiresMCP: boolean;
  humanGateOn: 'never' | 'always' | 'risky';
  version: string;
  tags: string[];
}

// ============================================================
// PATTERN TEMPLATES
// ============================================================

export const LOOP_PATTERNS: LoopPattern[] = [
  // === DAVID (Robbi Promotional / Merch) ===
  {
    id: 'david-sdr-triage',
    name: 'SDR Lead Triage',
    description: 'Scan lead sheet, score new entries, route qualified leads to outreach queue. Daily sweep of untouched leads.',
    lane: 'david',
    cadence: '1d',
    maxIterations: 50,
    prompt: `You are the SDR Triage Agent for Robbi Promotional.

## Task
1. Read the lead sheet (Google Sheets: SDR Leads)
2. Identify leads with status "New" or "Untouched" from the last 24h
3. Score each lead 1-10 based on: business type, location (NJ/NYC/FL/CT/MA/MD), signal strength
4. Move leads scoring 7+ to "Qualified" status
5. Log results to loop-run-log

## Rules
- Only process leads from territories: NJ, NYC, FL, CT, MA, MD
- Do NOT contact leads — only score and route
- Update STATE.md with counts
- Escalate if >20 new leads (human review needed)`,
    estimatedTokensPerIteration: 8000,
    readinessLevel: 'L1',
    riskLevel: 'low',
    requiresSubAgents: false,
    requiresMCP: true,
    humanGateOn: 'never',
    version: '1.0.0',
    tags: ['sdr', 'leads', 'triage', 'scoring'],
  },
  {
    id: 'david-outreach-draft',
    name: 'Outreach Draft Generator',
    description: 'Generate personalized outreach copy for qualified promo/merch leads. Pulls from lead sheet, pushes to outreach queue.',
    lane: 'david',
    cadence: '2h',
    maxIterations: 20,
    prompt: `You are the Outreach Draft Agent for Robbi Promotional.

## Task
1. Pull "Qualified" leads from the lead sheet
2. For each lead, generate personalized outreach copy based on:
   - Business type (restaurant, retail, service, etc.)
   - Territory (NJ/NYC/FL/CT/MA/MD)
   - Industry vertical
3. Save drafts to outreach queue (Google Sheets: Outreach Queue)
4. Update lead status to "Drafted"

## Rules
- Tone: professional but warm, local business owner to local business owner
- Max 150 words per outreach message
- Include one specific reference to their business/area
- Do NOT send — only draft
- Flag any leads that need human review (unusual business type, sensitive industry)`,
    estimatedTokensPerIteration: 12000,
    readinessLevel: 'L1',
    riskLevel: 'medium',
    requiresSubAgents: false,
    requiresMCP: true,
    humanGateOn: 'risky',
    version: '1.0.0',
    tags: ['outreach', 'copywriting', 'merch', 'promo'],
  },
  {
    id: 'david-image-gen',
    name: 'Promo Image Pipeline',
    description: 'Generate branded promo/merch images for outreach. Pulls from campaign queue, generates via ComfyUI/FAL, uploads to R2.',
    lane: 'david',
    cadence: '6h',
    maxIterations: 10,
    prompt: `You are the Promo Image Agent for Robbi Promotional.

## Task
1. Read campaign queue for pending image requests
2. For each request, generate a branded promo image:
   - Use brand colors from config/brand-colors.json
   - Include business name and offer text
   - Follow image spec from campaign template
3. Upload generated images to Cloudflare R2 (promo-assets bucket)
4. Update campaign queue with image URLs
5. Log to loop-run-log

## Rules
- Images must be 1080x1080 (square) or 1080x1350 (portrait)
- Max 3 generations per lead (cost control)
- Do NOT use images without brand approval flag
- Escalate if generation fails 2+ times for same lead`,
    estimatedTokensPerIteration: 15000,
    readinessLevel: 'L1',
    riskLevel: 'medium',
    requiresSubAgents: true,
    requiresMCP: true,
    humanGateOn: 'risky',
    version: '1.0.0',
    tags: ['images', 'promo', 'merch', 'r2', 'comfyui'],
  },

  // === JOSH (My Commercial Funding) ===
  {
    id: 'josh-funding-intake',
    name: 'Funding Inquiry Qualifier',
    description: 'Qualify incoming funding inquiries. Route to correct product (MCA, LOC, Equipment, Working Capital, SBA). Reject non-fits.',
    lane: 'josh',
    cadence: '30m',
    maxIterations: 30,
    prompt: `You are the Funding Qualifier Agent for My Commercial Funding.

## Task
1. Check intake form / inbox for new funding inquiries
2. For each inquiry, determine:
   - Is this a business funding need? (If personal/HELOC → reject with polite message)
   - Which product fits best? (MCA, Business LOC, Equipment Financing, Working Capital, SBA)
   - Is the request within our territory? (NJ, NYC, FL, CT, MA, MD)
   - Basic qualification: 6+ months in business, $10k+/month revenue
3. Route qualified leads to "Application Queue" with product tag
4. Send rejection message for non-fits (template: polite, referral to appropriate resource)
5. Log to loop-run-log

## Rules
- MCF does NOT offer HELOCs — business financing only
- Never make lending promises or rate quotes
- Flag complex deals (>$500k, unusual industries) for human review
- Update STATE.md with pipeline counts`,
    estimatedTokensPerIteration: 10000,
    readinessLevel: 'L1',
    riskLevel: 'high',
    requiresSubAgents: false,
    requiresMCP: true,
    humanGateOn: 'risky',
    version: '1.0.0',
    tags: ['funding', 'qualification', 'mca', 'intake'],
  },
  {
    id: 'josh-doc-check',
    name: 'Document Collection Checker',
    description: 'Check which funding applications are missing documents. Send reminders. Update application status.',
    lane: 'josh',
    cadence: '2h',
    maxIterations: 50,
    prompt: `You are the Document Collection Agent for My Commercial Funding.

## Task
1. Read active funding applications from CRM/Documenso
2. For each application, check required documents:
   - Last 3 months bank statements
   - Business tax return (most recent)
   - Business formation documents
   - Owner ID (government issued)
   - Profit & Loss statement
3. For missing documents, send reminder email (template varies by document type)
4. Update application status: "Complete" when all docs received
5. Escalate applications missing docs >7 days to human review

## Rules
- Be professional but persistent — funding is time-sensitive
- Do NOT approve or deny — only track document receipt
- Flag any document discrepancies for human review
- Log to loop-run-log`,
    estimatedTokensPerIteration: 6000,
    readinessLevel: 'L1',
    riskLevel: 'low',
    requiresSubAgents: false,
    requiresMCP: true,
    humanGateOn: 'never',
    version: '1.0.0',
    tags: ['funding', 'documents', 'compliance', 'documenso'],
  },

  // === STEVE (Consulting / Ventures) ===
  {
    id: 'steve-competitor-watch',
    name: 'Competitor Intelligence Sweep',
    description: 'Monitor competitor websites, social media, and news for relevant changes. Summarize weekly.',
    lane: 'steve',
    cadence: '1d',
    maxIterations: 5,
    prompt: `You are the Competitor Intelligence Agent for Steve's consulting practice.

## Task
1. Check competitor list from config/competitors.json
2. For each competitor, scan:
   - Website (pricing changes, new offerings, blog posts)
   - LinkedIn (hiring, announcements, leadership changes)
   - Recent news/press releases
   - Product/feature changes relevant to our offerings
3. Compile a brief intelligence report:
   - What changed this week
   - Threat level (1-5)
   - Recommended action (if any)
4. Save report to intelligence/weekly-{date}.md
5. Update STATE.md

## Rules:
- Focus on actionable intelligence, not noise
- Flag major moves (pricing changes, new products, leadership changes) immediately
- Do NOT contact competitors or create accounts to access paywalled content
- Keep report under 500 words`,
    estimatedTokensPerIteration: 20000,
    readinessLevel: 'L1',
    riskLevel: 'low',
    requiresSubAgents: true,
    requiresMCP: false,
    humanGateOn: 'never',
    version: '1.0.0',
    tags: ['consulting', 'competitive-intelligence', 'research'],
  },
  {
    id: 'steve-deal-flow',
    name: 'Deal Flow Monitor',
    description: 'Scan for new deal opportunities, partnerships, or venture signals. Proactive pipeline building.',
    lane: 'steve',
    cadence: '1d',
    maxIterations: 10,
    prompt: `You are the Deal Flow Agent for Steve's consulting/ventures practice.

## Task
1. Scan sources for deal opportunities:
   - AngelList/Wellfound new startups in our territories
   - LinkedIn posts from founders seeking funding/advisors
   - Industry news (funding rounds, acquisitions in target sectors)
   - Referral network updates
2. Score opportunities: relevance (1-10), timing, fit
3. For score 7+: create deal record in pipeline with summary
4. Update STATE.md with pipeline stats

## Rules:
- Focus on B2B services, SaaS, real estate, and local business sectors
- Territory priority: NJ, NYC, FL, CT, MA, MD
- Do NOT commit to anything — only identify and log
- Flag time-sensitive opportunities (active fundraise, deadline) for immediate human review`,
    estimatedTokensPerIteration: 15000,
    readinessLevel: 'L1',
    riskLevel: 'medium',
    requiresSubAgents: true,
    requiresMCP: false,
    humanGateOn: 'risky',
    version: '1.0.0',
    tags: ['ventures', 'deals', 'pipeline', 'scouting'],
  },

  // === FATHOM (Real Estate) ===
  {
    id: 'fathom-listing-watch',
    name: 'New Listing Scout',
    description: 'Monitor MLS and listing sources for new properties matching Fathom Realty criteria.',
    lane: 'fathom',
    cadence: '2h',
    maxIterations: 20,
    prompt: `You are the Listing Scout Agent for Fathom Realty.

## Task
1. Check MLS feeds and listing sources for new properties:
   - MLS (primary source)
   - Zillow/Realtor.com (supplemental)
   - For-sale-by-owner sites
2. Filter by criteria:
   - Territory: NJ, NYC, FL, CT, MA, MD
   - Price range: config/fathom-price-range.json
   - Property type: single family, multi-family, commercial (as configured)
3. For matching listings, create record with:
   - Address, price, beds/baths, sqft
   - Days on market
   - Notes (unique features, condition indicators)
4. Update STATE.md with new listing count

## Rules:
- Do NOT contact listing agents — only log and summarize
- Flag pocket listings or off-market opportunities for human review
- Skip properties clearly overpriced (check against comps if available)
- Log to loop-run-log`,
    estimatedTokensPerIteration: 10000,
    readinessLevel: 'L1',
    riskLevel: 'low',
    requiresSubAgents: false,
    requiresMCP: true,
    humanGateOn: 'never',
    version: '1.0.0',
    tags: ['real-estate', 'listings', 'mls', 'fathom'],
  },
  {
    id: 'fathom-lead-nurture',
    name: 'Buyer/Seller Lead Nurture',
    description: 'Check pipeline for leads needing follow-up. Send nurture content. Update lead status.',
    lane: 'fathom',
    cadence: '1d',
    maxIterations: 40,
    prompt: `You are the Lead Nurture Agent for Fathom Realty.

## Task
1. Read lead pipeline from CRM
2. For each active lead, check:
   - Last contact date (if >5 days → needs touch)
   - Lead stage (new, contacted, qualified, application, closed)
   - Preferred contact method (email, phone, text)
3. For leads needing touch:
   - Generate personalized nurture message based on stage
   - Content ideas: market update, new listing alert, rate update, testimonial
4. Log outreach to loop-run-log
5. Update lead last-contact date

## Rules:
- Max 1 touch per lead per week
- Do NOT spam — quality over quantity
- Tone: helpful advisor, not salesperson
- Flag leads stuck in same stage >30 days for human review
- Do NOT make promises about approvals or timelines`,
    estimatedTokensPerIteration: 8000,
    readinessLevel: 'L1',
    riskLevel: 'medium',
    requiresSubAgents: false,
    requiresMCP: true,
    humanGateOn: 'risky',
    version: '1.0.0',
    tags: ['real-estate', 'nurture', 'follow-up', 'crm'],
  },

  // === SHARED / INFRASTRUCTURE ===
  {
    id: 'shared-overlord-health',
    name: 'Overlord System Health Check',
    description: 'Verify all Overlord services are running, tunnels healthy, disk space OK, no errors in logs.',
    lane: 'shared',
    cadence: '1h',
    maxIterations: 3,
    prompt: `You are the System Health Agent for Overlord.

## Task
1. Check services:
   - Next.js app (port 9125): responding to HTTP?
   - Nginx: running, SSL cert valid?
   - Cloudflare tunnel: active?
   - Documenso (if running): responding?
   - Disk space: <80% used?
2. Check logs for recent errors:
   - /var/log/nginx/error.log
   - PM2 logs for Next.js
   - Docker container health (if applicable)
3. If any issues found:
   - Attempt restart if safe (Docker, PM2)
   - Escalate to human if hardware/cert/network issue
4. Log to loop-run-log with status: healthy/degraded/critical

## Rules:
- Do NOT restart during active user sessions if avoidable
- Escalate SSL cert expiry <7 days out
- Escalate disk usage >90%
- Do NOT modify configs — only restart services`,
    estimatedTokensPerIteration: 4000,
    readinessLevel: 'L1',
    riskLevel: 'low',
    requiresSubAgents: false,
    requiresMCP: false,
    humanGateOn: 'risky',
    version: '1.0.0',
    tags: ['infrastructure', 'health', 'monitoring', 'overlord'],
  },
  {
    id: 'shared-backup-check',
    name: 'Backup Verification',
    description: 'Verify automated backups ran successfully. Test restore if needed.',
    lane: 'shared',
    cadence: '1d',
    maxIterations: 2,
    prompt: `You are the Backup Verification Agent.

## Task
1. Check backup status:
   - GitHub repos: any unpushed changes?
   - Google Drive sync: last sync timestamp
   - Documenso DB backup: last dump timestamp
   - Cloudflare R2: accessible, no errors
2. Verify backup integrity:
   - Can we read the latest backup file?
   - Is it within expected size range?
3. If backup missing or corrupted:
   - Attempt manual backup
   - Escalate to human if persistent failure
4. Log to loop-run-log

## Rules:
- Do NOT delete old backups without human approval
- Test restore monthly (not every run)
- Escalate if 2+ consecutive backups failed`,
    estimatedTokensPerIteration: 3000,
    readinessLevel: 'L1',
    riskLevel: 'low',
    requiresSubAgents: false,
    requiresMCP: false,
    humanGateOn: 'never',
    version: '1.0.0',
    tags: ['infrastructure', 'backup', 'disaster-recovery'],
  },
];

// ============================================================
// HELPERS
// ============================================================

export function getPatternsByLane(lane: BusinessLane): LoopPattern[] {
  return LOOP_PATTERNS.filter(p => p.lane === lane || p.lane === 'shared');
}

export function getPatternById(id: string): LoopPattern | undefined {
  return LOOP_PATTERNS.find(p => p.id === id);
}

export function estimateMonthlyCost(pattern: LoopPattern): number {
  const runsPerMonth = (() => {
    switch (pattern.cadence) {
      case '15m': return 4 * 30; // 120
      case '30m': return 2 * 30; // 60
      case '1h': return 30;
      case '2h': return 15;
      case '6h': return 5;
      case '1d': return 1;
      case '1w': return 0.25;
      default: return 1;
    }
  })();

  // Assume ~$0.01 per 1k tokens (varies by model, conservative estimate)
  const costPerRun = (pattern.estimatedTokensPerIteration / 1000) * 0.01;
  return Math.round(runsPerMonth * costPerRun * 100) / 100;
}

export function getReadinessScore(pattern: LoopPattern): number {
  let score = 0;

  // Base score from readiness level
  if (pattern.readinessLevel === 'L1') score += 30;
  if (pattern.readinessLevel === 'L2') score += 60;
  if (pattern.readinessLevel === 'L3') score += 90;

  // Risk penalty
  if (pattern.riskLevel === 'low') score += 10;
  if (pattern.riskLevel === 'medium') score += 5;
  // high risk = no bonus

  // Complexity penalty
  if (!pattern.requiresSubAgents) score += 5;
  if (!pattern.requiresMCP) score += 5;

  return Math.min(100, score);
}

export function getPatternsByReadiness(level: ReadinessLevel): LoopPattern[] {
  return LOOP_PATTERNS.filter(p => p.readinessLevel === level);
}

export function getPatternsByRisk(risk: RiskLevel): LoopPattern[] {
  return LOOP_PATTERNS.filter(p => p.riskLevel === risk);
}

export function getAllLanes(): BusinessLane[] {
  return ['david', 'josh', 'steve', 'fathom', 'shared'];
}

export function getLaneLabel(lane: BusinessLane): string {
  const labels: Record<BusinessLane, string> = {
    david: 'David (Promo/Merch)',
    josh: 'Josh (Commercial Funding)',
    steve: 'Steve (Consulting/Ventures)',
    fathom: 'Fathom (Real Estate)',
    shared: 'Shared (Infrastructure)',
  };
  return labels[lane];
}

export function getCadenceMinutes(cadence: Cadence): number {
  switch (cadence) {
    case '15m': return 15;
    case '30m': return 30;
    case '1h': return 60;
    case '2h': return 120;
    case '6h': return 360;
    case '1d': return 1440;
    case '1w': return 10080;
    default: return 60;
  }
}
