import { GraphResponse, GraphNode, GraphEdge } from '@/types/api';

export function getMockCaseGraph(caseId: string): GraphResponse {
  // Deterministic synthetic graph fixture strictly adhering to synthetic data rules.
  
  const nodes: GraphNode[] = [
    {
      id: 'P001',
      label: 'Person',
      entity_type: 'PERSON',
      case_id: caseId,
      source_document_ids: ['DOC001'],
      properties: { name: 'Aditya Malhotra', person_id: 'P001' }
    },
    {
      id: 'ORG001',
      label: 'Organization',
      entity_type: 'ORGANIZATION',
      case_id: caseId,
      source_document_ids: ['DOC001'],
      properties: { name: 'Apex Traders', org_id: 'ORG001' }
    },
    {
      id: 'P002',
      label: 'Person',
      entity_type: 'PERSON',
      case_id: caseId,
      source_document_ids: ['DOC001'],
      properties: { name: 'Priya Sharma', person_id: 'P002' }
    },
    {
      id: 'PH001',
      label: 'Phone',
      entity_type: 'PHONE',
      case_id: caseId,
      source_document_ids: ['DOC002'],
      properties: { phone_number: '+91 98765 43210' }
    },
    {
      id: 'V001',
      label: 'Vehicle',
      entity_type: 'VEHICLE',
      case_id: caseId,
      source_document_ids: ['DOC003'],
      properties: { license_plate: 'DL-01-AB-1234', make: 'Hyundai', model: 'Creta' }
    },
    {
      id: 'LOC001',
      label: 'Location',
      entity_type: 'LOCATION',
      case_id: caseId,
      source_document_ids: ['DOC004'],
      properties: { address: 'Sector 18 Warehouse, Noida' }
    },
    {
      id: 'BA001',
      label: 'BankAccount',
      entity_type: 'BANK_ACCOUNT',
      case_id: caseId,
      source_document_ids: ['DOC005'],
      properties: { account_number: 'HDFC-ACCT-40912', bank_name: 'HDFC Bank' }
    },
    {
      id: 'CASE001',
      label: 'Case',
      entity_type: 'CASE',
      case_id: caseId,
      source_document_ids: [],
      properties: { title: 'Synthetic Syndicate Operations', case_number: caseId }
    }
  ];

  const edges: GraphEdge[] = [
    {
      id: 'E001',
      source_id: 'P001',
      target_id: 'PH001',
      relationship_type: 'OWNS',
      properties: {},
      source_document_id: 'DOC002',
      source_type: 'CDR',
      event_date: '2025-01-01T10:00:00Z',
      confidence: 1.0,
      verified: true,
    },
    {
      id: 'E002',
      source_id: 'P002',
      target_id: 'PH001',
      relationship_type: 'CALLED',
      properties: { duration: 120 },
      source_document_id: 'DOC002',
      source_type: 'CDR',
      event_date: '2025-01-02T14:30:00Z',
      confidence: 0.95,
      verified: true,
    },
    {
      id: 'E003',
      source_id: 'P001',
      target_id: 'V001',
      relationship_type: 'DRIVES',
      properties: {},
      source_document_id: 'DOC003',
      source_type: 'VEHICLE_LOG',
      event_date: null,
      confidence: 0.8,
      verified: false,
    },
    {
      id: 'E004',
      source_id: 'P001',
      target_id: 'LOC001',
      relationship_type: 'VISITED',
      properties: {},
      source_document_id: 'DOC004',
      source_type: 'LOCATION_LOG',
      event_date: '2025-01-03T09:15:00Z',
      confidence: 0.9,
      verified: true,
    },
    {
      id: 'E005',
      source_id: 'BA001',
      target_id: 'P001',
      relationship_type: 'OWNED_BY',
      properties: {},
      source_document_id: 'DOC005',
      source_type: 'BANK_STATEMENT',
      event_date: null,
      confidence: 0.99,
      verified: true,
    }
  ];

  return {
    case_id: caseId,
    nodes,
    edges,
    generated_at: new Date().toISOString(),
    truncated: false
  };
}
