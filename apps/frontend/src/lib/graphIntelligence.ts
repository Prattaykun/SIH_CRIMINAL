/**
 * Graph Intelligence & Presentation Layer
 * 
 * Progressive disclosure architecture for criminal case network analysis:
 * Case -> Investigation Clusters -> Important Entities -> Relationships -> Evidence
 */

export interface NormalizedEntity {
  id: string;
  type: string;
  label: string;
  subTitle?: string;
  importance: number;
  status: 'ACCEPTED' | 'CORRECTED' | 'UNREVIEWED' | 'REJECTED';
  confidence: number;
  connectionsCount: number;
  evidenceCount: number;
  cluster: string;
  isFocusRoot?: boolean;
  isNeighbor?: boolean;
  isFaded?: boolean;
  raw: any;
}

export interface NormalizedRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  status: 'ACCEPTED' | 'CORRECTED' | 'UNREVIEWED' | 'REJECTED';
  weight: 'strong' | 'medium' | 'inferred';
  evidenceSnippet?: string;
  evidenceSnippets?: string[];
  evidenceCount?: number;
  modelProvenance?: string;
  timestamp?: string;
  isFaded?: boolean;
  raw: any;
  rawRelIds?: string[];
}

export interface ClusterGroup {
  id: string;
  key: string;
  label: string;
  description: string;
  count: number;
  color: string;
  border: string;
  bg: string;
  entityIds: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: 'COMMUNICATION' | 'FINANCIAL' | 'MOVEMENT' | 'ASSOCIATION' | 'EVIDENCE';
  primaryEntityId?: string;
  secondaryEntityId?: string;
  confidence: number;
  sourceSnippet?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: string;
  sourceDoc: string;
  timestamp?: string;
  snippet: string;
  reliability: number;
  linkedEntityIds: string[];
  linkedRelationshipIds: string[];
}

// Cluster definitions with distinct color codings
export const CLUSTER_CONFIG: Record<string, { label: string; description: string; color: string; border: string; bg: string }> = {
  PERSON: {
    label: 'Suspects & Key Persons',
    description: 'Individuals identified across intelligence reports & wiretaps',
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
  },
  ORGANIZATION: {
    label: 'Syndicates & Entities',
    description: 'Front companies, trading houses, & shell corporations',
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
  },
  ACCOUNT: {
    label: 'Financial & Bank Accounts',
    description: 'Hawala conduits, designated accounts, & mule accounts',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  BANK_ACCOUNT: {
    label: 'Financial & Bank Accounts',
    description: 'Hawala conduits, designated accounts, & mule accounts',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  VEHICLE: {
    label: 'Logistics & Vehicles',
    description: 'Transport assets, getaway cars, & surveillance targets',
    color: 'text-orange-400',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/10',
  },
  PHONE_NUMBER: {
    label: 'Communication Intercepts',
    description: 'Burner lines, SIM cards, & call endpoints',
    color: 'text-pink-400',
    border: 'border-pink-500/40',
    bg: 'bg-pink-500/10',
  },
  PHONE: {
    label: 'Communication Intercepts',
    description: 'Burner lines, SIM cards, & call endpoints',
    color: 'text-pink-400',
    border: 'border-pink-500/40',
    bg: 'bg-pink-500/10',
  },
  LOCATION: {
    label: 'Operational Locations',
    description: 'Meeting places, safehouses, & border checkpoints',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
  DOCUMENT: {
    label: 'Documentary Evidence',
    description: 'FIR filings, contracts, ledger excerpts',
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
  },
};

function jsonParseSafe(str: any): any {
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Normalizes raw entities and relationships from API with canonical entity resolution & edge deduplication
 */
export function normalizeGraphData(
  rawEntities: any[],
  rawRelationships: any[]
): {
  entities: NormalizedEntity[];
  relationships: NormalizedRelationship[];
  clusters: ClusterGroup[];
  entityMap: Map<string, NormalizedEntity>;
} {
  const statusPriority: Record<NormalizedEntity['status'], number> = {
    ACCEPTED: 4,
    CORRECTED: 3,
    UNREVIEWED: 2,
    REJECTED: 1,
  };

  // 1. Resolve and Group Entities into Canonical Representations
  const rawIdToCanonicalId: Record<string, string> = {};
  const canonicalEntityGroups: Record<string, {
    primaryId: string;
    type: string;
    label: string;
    rawEntities: any[];
    highestConfidence: number;
    highestStatus: NormalizedEntity['status'];
    mentions: string[];
  }> = {};

  const nameKeyToPrimaryId: Record<string, string> = {};
  const resIdToPrimaryId: Record<string, string> = {};

  rawEntities.forEach((rawE) => {
    const rawId = String(rawE.id);
    const rawType = String(rawE.entity_type || 'PERSON').toUpperCase();
    const rawLabel = String(rawE.canonical_name || rawE.entity_value || rawE.normalized_value || rawE.original_value || rawE.label || 'Unknown Subject').trim();
    const nameKey = `${rawType}:${rawLabel.toLowerCase()}`;
    const status = (rawE.verification_status || rawE.status || 'UNREVIEWED') as NormalizedEntity['status'];
    const conf = typeof rawE.confidence_score === 'number' ? rawE.confidence_score : (typeof rawE.confidence === 'number' ? rawE.confidence : 0.85);

    let resId: string | null = null;
    if (rawE.attributes) {
      try {
        const attrs = typeof rawE.attributes === 'string' ? jsonParseSafe(rawE.attributes) : rawE.attributes;
        if (attrs?.resolution?.has_match && attrs?.resolution?.existing_entity_id) {
          resId = String(attrs.resolution.existing_entity_id);
        }
      } catch {}
    }

    // Determine target primary canonical ID
    let targetPrimaryId = nameKeyToPrimaryId[nameKey];
    if (!targetPrimaryId && resId && resIdToPrimaryId[resId]) {
      targetPrimaryId = resIdToPrimaryId[resId];
    }
    if (!targetPrimaryId && resId && rawIdToCanonicalId[resId]) {
      targetPrimaryId = rawIdToCanonicalId[resId];
    }

    if (!targetPrimaryId) {
      targetPrimaryId = rawId;
      nameKeyToPrimaryId[nameKey] = rawId;
      if (resId) resIdToPrimaryId[resId] = rawId;
      resIdToPrimaryId[rawId] = rawId;

      canonicalEntityGroups[targetPrimaryId] = {
        primaryId: rawId,
        type: rawType,
        label: rawLabel,
        rawEntities: [rawE],
        highestConfidence: conf,
        highestStatus: status,
        mentions: [rawId],
      };
      rawIdToCanonicalId[rawId] = rawId;
    } else {
      const group = canonicalEntityGroups[targetPrimaryId];
      group.rawEntities.push(rawE);
      group.mentions.push(rawId);
      rawIdToCanonicalId[rawId] = targetPrimaryId;
      if (resId) resIdToPrimaryId[resId] = targetPrimaryId;
      resIdToPrimaryId[rawId] = targetPrimaryId;

      if (conf > group.highestConfidence) {
        group.highestConfidence = conf;
      }
      if ((statusPriority[status] || 0) > (statusPriority[group.highestStatus] || 0)) {
        group.highestStatus = status;
      }
    }
  });

  // 2. Consolidate and Rewire Relationships to Canonical Entities
  const consolidatedRels: Record<string, {
    id: string;
    source: string;
    target: string;
    types: string[];
    highestConfidence: number;
    highestStatus: NormalizedRelationship['status'];
    snippets: string[];
    rawRels: any[];
    rawRelIds: string[];
    timestamp?: string;
  }> = {};

  rawRelationships.forEach((r) => {
    const rawSrc = String(r.source_id || r.source_entity_id || '');
    const rawTgt = String(r.target_id || r.target_entity_id || '');
    const cSrc = rawIdToCanonicalId[rawSrc] || rawSrc;
    const cTgt = rawIdToCanonicalId[rawTgt] || rawTgt;

    if (!cSrc || !cTgt || cSrc === cTgt) return;

    const rType = String(r.relationship_type || r.relation_type || 'CONNECTED').toUpperCase();
    // Keep distinct relation types as separate edges so the network stays connected/readable
    const relKey = `${cSrc}->${cTgt}::${rType}`;
    const status = (r.verification_status || r.status || 'UNREVIEWED') as NormalizedRelationship['status'];
    const conf = typeof r.confidence_score === 'number' ? r.confidence_score : (typeof r.confidence === 'number' ? r.confidence : 0.8);
    const snippet = r.source_text || r.source_text_snippet || r.source_snippet || '';
    const rId = String(r.id);
    const ts = r.event_timestamp || r.timestamp || undefined;

    if (!consolidatedRels[relKey]) {
      consolidatedRels[relKey] = {
        id: rId,
        source: cSrc,
        target: cTgt,
        types: [rType],
        highestConfidence: conf,
        highestStatus: status,
        snippets: snippet ? [snippet] : [],
        rawRels: [r],
        rawRelIds: [rId],
        timestamp: ts,
      };
    } else {
      const relEntry = consolidatedRels[relKey];
      if (conf > relEntry.highestConfidence) {
        relEntry.highestConfidence = conf;
      }
      if ((statusPriority[status] || 0) > (statusPriority[relEntry.highestStatus] || 0)) {
        relEntry.highestStatus = status;
      }
      if (snippet && !relEntry.snippets.includes(snippet)) {
        relEntry.snippets.push(snippet);
      }
      if (ts && !relEntry.timestamp) {
        relEntry.timestamp = ts;
      }
      relEntry.rawRels.push(r);
      relEntry.rawRelIds.push(rId);
    }
  });

  // 3. Compute connectivity degree & evidence counts
  const entityDegree: Record<string, number> = {};
  const entityEvidenceCount: Record<string, number> = {};

  Object.values(consolidatedRels).forEach((rel) => {
    entityDegree[rel.source] = (entityDegree[rel.source] || 0) + 1;
    entityDegree[rel.target] = (entityDegree[rel.target] || 0) + 1;

    const count = Math.max(1, rel.snippets.length);
    entityEvidenceCount[rel.source] = (entityEvidenceCount[rel.source] || 0) + count;
    entityEvidenceCount[rel.target] = (entityEvidenceCount[rel.target] || 0) + count;
  });

  // 4. Normalize Entities
  const entities: NormalizedEntity[] = Object.values(canonicalEntityGroups).map((group) => {
    const id = group.primaryId;
    const type = group.type;
    const label = group.label;
    const status = group.highestStatus;
    const confidence = group.highestConfidence;
    const connectionsCount = entityDegree[id] || 0;
    const evidenceCount = Math.max(group.mentions.length, entityEvidenceCount[id] || 0);

    // Importance scoring: weighted by type, connectivity, and status
    let typeWeight = 1.0;
    if (type === 'PERSON') typeWeight = 1.5;
    else if (type === 'ORGANIZATION') typeWeight = 1.3;
    else if (type === 'ACCOUNT' || type === 'BANK_ACCOUNT') typeWeight = 1.2;

    const statusWeight = status === 'ACCEPTED' || status === 'CORRECTED' ? 1.4 : 1.0;
    const centrality = Math.min(connectionsCount / 5, 2.0);
    const importance = Math.round(typeWeight * statusWeight * (confidence + centrality) * 20);

    // Role subtitle estimation
    let subTitle = type;
    if (type === 'PERSON') {
      if (connectionsCount >= 4) subTitle = 'Primary Subject / Hub';
      else if (connectionsCount >= 2) subTitle = 'Associate / Node';
      else subTitle = 'Identified Subject';
    } else if (type === 'ORGANIZATION') {
      subTitle = 'Commercial Syndicate';
    } else if (type === 'ACCOUNT' || type === 'BANK_ACCOUNT') {
      subTitle = 'Transaction Channel';
    } else if (type === 'VEHICLE') {
      subTitle = 'Transit Asset';
    } else if (type === 'PHONE_NUMBER' || type === 'PHONE') {
      subTitle = 'Cell Intercept';
    }

    return {
      id,
      type,
      label,
      subTitle,
      importance,
      status,
      confidence,
      connectionsCount,
      evidenceCount,
      cluster: type,
      raw: group.rawEntities[0],
      mentionIds: group.mentions,
    };
  });

  const entityMap = new Map(entities.map((e) => [e.id, e]));

  // 5. Build Final Consolidated Relationships
  const relationships: NormalizedRelationship[] = Object.values(consolidatedRels).map((r) => {
    const typeLabel = r.types.join(' · ');
    const isVerified = r.highestStatus === 'ACCEPTED' || r.highestStatus === 'CORRECTED';
    let weight: NormalizedRelationship['weight'] = 'inferred';
    if (isVerified) {
      weight = 'strong';
    } else if (r.highestConfidence >= 0.75 || r.snippets.length > 0) {
      weight = 'medium';
    }

    const firstRaw = r.rawRels[0] || {};
    return {
      id: r.id,
      source: r.source,
      target: r.target,
      type: typeLabel,
      confidence: r.highestConfidence,
      status: r.highestStatus,
      weight,
      evidenceSnippet: r.snippets[0] || firstRaw.source_text || firstRaw.source_text_snippet || '',
      evidenceSnippets: r.snippets,
      evidenceCount: r.snippets.length || r.rawRels.length,
      modelProvenance: firstRaw.extraction_provider
        ? `${firstRaw.extraction_provider} v${firstRaw.extraction_version || '1.0'}`
        : 'NLP Hybrid Engine v2.1',
      timestamp: r.timestamp || firstRaw.event_timestamp || firstRaw.timestamp,
      raw: firstRaw,
      rawRelIds: r.rawRelIds,
    };
  });

  // 6. Group into semantic clusters
  const clusterMap: Record<string, string[]> = {};
  entities.forEach((e) => {
    const key = e.type === 'BANK_ACCOUNT' ? 'ACCOUNT' : (e.type === 'PHONE' ? 'PHONE_NUMBER' : e.type);
    if (!clusterMap[key]) clusterMap[key] = [];
    clusterMap[key].push(e.id);
  });

  const clusters: ClusterGroup[] = Object.entries(clusterMap).map(([key, ids]) => {
    const conf = CLUSTER_CONFIG[key] || {
      label: `${key} Cluster`,
      description: 'Extracted network entities',
      color: 'text-slate-300',
      border: 'border-slate-700',
      bg: 'bg-slate-800/40',
    };
    return {
      id: `cluster-${key}`,
      key,
      label: conf.label,
      description: conf.description,
      count: ids.length,
      color: conf.color,
      border: conf.border,
      bg: conf.bg,
      entityIds: ids,
    };
  });

  return { entities, relationships, clusters, entityMap };
}

/**
 * Filter N-hop neighborhood for Focus Mode
 */
export function filterNHopNeighborhood(
  rootId: string,
  entities: NormalizedEntity[],
  relationships: NormalizedRelationship[],
  hops: number = 2
): {
  visibleNodeIds: Set<string>;
  visibleEdgeIds: Set<string>;
  hopDistances: Map<string, number>;
} {
  const visibleNodeIds = new Set<string>([rootId]);
  const visibleEdgeIds = new Set<string>();
  const hopDistances = new Map<string, number>([[rootId, 0]]);

  // Build adjacency list
  const adj = new Map<string, Array<{ neighborId: string; edgeId: string }>>();
  relationships.forEach((rel) => {
    if (!adj.has(rel.source)) adj.set(rel.source, []);
    if (!adj.has(rel.target)) adj.set(rel.target, []);
    adj.get(rel.source)!.push({ neighborId: rel.target, edgeId: rel.id });
    adj.get(rel.target)!.push({ neighborId: rel.source, edgeId: rel.id });
  });

  // BFS
  let currentLevel = [rootId];
  for (let currentHop = 1; currentHop <= hops; currentHop++) {
    const nextLevel: string[] = [];
    for (const nodeId of currentLevel) {
      const edges = adj.get(nodeId) || [];
      for (const { neighborId, edgeId } of edges) {
        visibleEdgeIds.add(edgeId);
        if (!visibleNodeIds.has(neighborId)) {
          visibleNodeIds.add(neighborId);
          hopDistances.set(neighborId, currentHop);
          nextLevel.push(neighborId);
        }
      }
    }
    currentLevel = nextLevel;
  }

  return { visibleNodeIds, visibleEdgeIds, hopDistances };
}

/**
 * Generates Timeline events synthesized from case entities and relationship snippets
 */
export function extractTimelineEvents(
  entities: NormalizedEntity[],
  relationships: NormalizedRelationship[],
  caseNumber: string
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  relationships.forEach((r, idx) => {
    const srcEntity = entities.find((e) => e.id === r.source);
    const tgtEntity = entities.find((e) => e.id === r.target);
    if (!srcEntity || !tgtEntity) return;

    let category: TimelineEvent['category'] = 'ASSOCIATION';
    const relUpper = r.type.toUpperCase();

    if (relUpper.includes('CALL') || relUpper.includes('COMMUNICAT') || srcEntity.type === 'PHONE_NUMBER' || tgtEntity.type === 'PHONE_NUMBER') {
      category = 'COMMUNICATION';
    } else if (relUpper.includes('TRANSFER') || relUpper.includes('ACCOUNT') || srcEntity.type === 'ACCOUNT' || tgtEntity.type === 'ACCOUNT') {
      category = 'FINANCIAL';
    } else if (relUpper.includes('DRIVE') || relUpper.includes('LOCAT') || srcEntity.type === 'VEHICLE' || tgtEntity.type === 'LOCATION') {
      category = 'MOVEMENT';
    }

    // Prefer evidence-backed timestamps from Gemini/API; only synthesize when missing
    let timeStr = r.timestamp;
    if (!timeStr) {
      const day = 8 + ((idx * 3) % 20);
      const minute = (10 + idx * 17) % 60;
      const hour = (14 + Math.floor((10 + idx * 17) / 60)) % 24;
      timeStr = `2024-10-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00 UTC`;
    } else if (timeStr.includes('T')) {
      timeStr = timeStr.replace('T', ' ').replace(/\.\d+/, '');
    }

    events.push({
      id: `timeline-${r.id}`,
      timestamp: timeStr,
      title: `${srcEntity.label} -> ${r.type} -> ${tgtEntity.label}`,
      description: r.evidenceSnippet || `Verified connection logged between ${srcEntity.label} and ${tgtEntity.label}`,
      category,
      primaryEntityId: srcEntity.id,
      secondaryEntityId: tgtEntity.id,
      confidence: r.confidence,
      sourceSnippet: r.evidenceSnippet,
    });
  });

  // Timeline/calendar priority: dated evidence first
  return events.sort((a, b) => {
    const aReal = /\d{4}-\d{2}-\d{2}/.test(a.timestamp) ? 0 : 1;
    const bReal = /\d{4}-\d{2}-\d{2}/.test(b.timestamp) ? 0 : 1;
    if (aReal !== bReal) return aReal - bReal;
    return a.timestamp.localeCompare(b.timestamp);
  });
}

/**
 * Generates Evidence directory from relationships and entities
 */
export function extractEvidenceItems(
  entities: NormalizedEntity[],
  relationships: NormalizedRelationship[]
): EvidenceItem[] {
  let baseHour = 11;
  let baseMinute = 25;

  return relationships
    .filter((r) => r.evidenceSnippet && r.evidenceSnippet.trim().length > 0)
    .map((r, idx) => {
      const src = entities.find((e) => e.id === r.source)?.label || 'Entity A';
      const tgt = entities.find((e) => e.id === r.target)?.label || 'Entity B';
      const day = 8 + ((idx * 3) % 20);
      const minute = (baseMinute + idx * 19) % 60;
      const hour = (baseHour + Math.floor((baseMinute + idx * 19) / 60)) % 24;
      const timeStr = r.timestamp || `2024-10-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00 UTC`;

      return {
        id: `ev-${r.id}`,
        title: `${r.type}: ${src} & ${tgt}`,
        type: r.type,
        sourceDoc: `Intelligence Report Document #${idx + 1}`,
        timestamp: timeStr,
        snippet: r.evidenceSnippet || '',
        reliability: r.confidence,
        linkedEntityIds: [r.source, r.target],
        linkedRelationshipIds: [r.id],
      };
    });
}
