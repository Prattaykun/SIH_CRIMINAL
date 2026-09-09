'use client';

import React, { useState } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { VerificationStatus } from '../extraction/ExtractionCandidateCard';

export function EvidenceTable({ entities, relationships, onReview, onRowClick, selectedId }: any) {
  const [activeTab, setActiveTab] = useState<'entities' | 'relationships'>('entities');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREVIEWED' | 'ACCEPTED' | 'REJECTED'>('UNREVIEWED');
  const [search, setSearch] = useState('');

  const filteredEntities = entities.filter((e: any) => {
    const matchesStatus = statusFilter === 'ALL' || e.verification_status === statusFilter;
    const matchesSearch = 
      (e.normalized_value && e.normalized_value.toLowerCase().includes(search.toLowerCase())) || 
      (e.entity_type && e.entity_type.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredRelationships = relationships.filter((r: any) => {
    const matchesStatus = statusFilter === 'ALL' || r.verification_status === statusFilter;
    const matchesSearch = 
      (r.relation_type && r.relation_type.toLowerCase().includes(search.toLowerCase())) ||
      (r.source_entity_id && r.source_entity_id.toLowerCase().includes(search.toLowerCase())) ||
      (r.target_entity_id && r.target_entity_id.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleReview = (e: React.MouseEvent, type: 'entity' | 'relationship', id: string, status: VerificationStatus) => {
    e.stopPropagation(); // prevent row click
    onReview(type, id, status);
  };

  const renderStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ACCEPTED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">REJECTED</span>;
      case 'CORRECTED':
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">CORRECTED</span>;
      case 'UNREVIEWED':
      default:
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">UNREVIEWED</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl mt-6">
      {/* Top Header & Tabs */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/40">
        <div className="flex gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('entities')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'entities' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entities ({entities.length})
          </button>
          <button
            onClick={() => setActiveTab('relationships')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'relationships' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Relationships ({relationships.length})
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 w-64"
          />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Records</option>
            <option value="UNREVIEWED">Unreviewed Only</option>
            <option value="ACCEPTED">Accepted Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
          <button
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Bulk Actions
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 sticky top-0 border-b border-slate-800 z-10">
            <tr>
              <th className="px-5 py-3">{activeTab === 'entities' ? 'Extracted Value' : 'Subject / Target'}</th>
              <th className="px-4 py-3">{activeTab === 'entities' ? 'Category' : 'Relationship'}</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-6 py-3">Surrounding Evidence Context</th>
              <th className="px-5 py-3 text-right">Verification Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {activeTab === 'entities' && filteredEntities.map((item: any) => (
              <tr 
                key={item.id} 
                onClick={() => onRowClick && onRowClick(item, 'entity')}
                className={`transition-colors group cursor-pointer ${selectedId === item.id ? 'bg-blue-900/30' : 'hover:bg-slate-800/40'}`}
              >
                <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">
                  {item.normalized_value}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    item.entity_type === 'PERSON' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    item.entity_type === 'ORGANIZATION' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    item.entity_type === 'VEHICLE' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    item.entity_type === 'ACCOUNT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    item.entity_type === 'PHONE_NUMBER' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    item.entity_type === 'LOCATION' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                    'bg-slate-700/40 text-slate-300 border border-slate-600'
                  }`}>
                    {item.entity_type}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-slate-300">
                      {Math.round((item.confidence || 0.85) * 100)}%
                    </span>
                    <div className="w-12 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${(item.confidence || 0.85) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-xs text-slate-400 max-w-md italic">
                  <span className="line-clamp-2">
                    "{item.source_text ? (
                      item.source_text.includes(item.original_value || item.normalized_value) ? (
                        <>
                          {item.source_text.split(new RegExp(`(${item.original_value || item.normalized_value})`, 'gi')).map((part: string, i: number) => 
                            part.toLowerCase() === (item.original_value || item.normalized_value).toLowerCase() ? 
                            <span key={i} className="text-yellow-400 font-bold bg-yellow-400/10 px-0.5 rounded">{part}</span> : part
                          )}
                        </>
                      ) : item.source_text
                    ) : 'Extracted from primary document.'}"
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  {item.verification_status === 'UNREVIEWED' ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => handleReview(e, 'entity', item.id, 'ACCEPTED')}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded border border-emerald-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <Check className="size-3" /> Accept
                      </button>
                      <button
                        onClick={(e) => handleReview(e, 'entity', item.id, 'REJECTED')}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded border border-rose-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <X className="size-3" /> Reject
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRowClick && onRowClick(item, 'entity', true); }}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded border border-blue-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <Edit2 className="size-3" /> Edit
                      </button>
                    </div>
                  ) : (
                    renderStatusBadge(item.verification_status)
                  )}
                </td>
              </tr>
            ))}
            
            {activeTab === 'relationships' && filteredRelationships.map((item: any) => (
              <tr 
                key={item.id} 
                onClick={() => onRowClick && onRowClick(item, 'relationship')}
                className={`transition-colors group cursor-pointer ${selectedId === item.id ? 'bg-blue-900/30' : 'hover:bg-slate-800/40'}`}
              >
                <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Sub: <span className="text-white">{item.source_entity_id}</span></span>
                    <span className="text-xs text-slate-400 mt-1">Tar: <span className="text-white">{item.target_entity_id}</span></span>
                  </div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {item.relation_type}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-slate-300">
                      {Math.round((item.confidence || 0.85) * 100)}%
                    </span>
                    <div className="w-12 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${(item.confidence || 0.85) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-xs text-slate-400 max-w-md italic">
                  <span className="line-clamp-2">"{item.source_text || 'Extracted from primary document.'}"</span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  {item.verification_status === 'UNREVIEWED' ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => handleReview(e, 'relationship', item.id, 'ACCEPTED')}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded border border-emerald-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <Check className="size-3" /> Accept
                      </button>
                      <button
                        onClick={(e) => handleReview(e, 'relationship', item.id, 'REJECTED')}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded border border-rose-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <X className="size-3" /> Reject
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRowClick && onRowClick(item, 'relationship', true); }}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded border border-blue-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <Edit2 className="size-3" /> Edit
                      </button>
                    </div>
                  ) : (
                    renderStatusBadge(item.verification_status)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {((activeTab === 'entities' && filteredEntities.length === 0) || 
          (activeTab === 'relationships' && filteredRelationships.length === 0)) && (
          <div className="text-center py-10 text-slate-500">
            No records found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
