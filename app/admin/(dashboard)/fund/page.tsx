'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Eye, EyeOff, Activity, ArrowRightLeft, DollarSign, Wallet } from 'lucide-react';
import { getRedistributionRecords, createRedistributionRecord, updateRedistributionRecord, deleteRedistributionRecord, getIncomingDonations, updateDonationPublicName } from '@/app/admin/actions/redistributionRecords.actions';

export default function RedistributionRecordPage() {
  const [items, setItems] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [totalRedirected, setTotalRedirected] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  
  const [editingPublicNameId, setEditingPublicNameId] = useState<string | null>(null);
  const [editingPublicNameValue, setEditingPublicNameValue] = useState<string>('');

  const [formData, setFormData] = useState<any>({ amount: 0, destination: "", description: "", proofUrl: "", donatedAt: "", transactionReference: "", hidden: false });

  const loadData = async () => {
    const data = await getRedistributionRecords();
    const sorted = (data || []).sort((a: any, b: any) => new Date(b.donatedAt || 0).getTime() - new Date(a.donatedAt || 0).getTime());
    setItems(sorted);
    
    const sumRedirected = sorted.filter((r:any) => !r.hidden).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
    setTotalRedirected(sumRedirected);

    const incDonations = await getIncomingDonations();
    setDonations(incDonations || []);
    
    const sumCollected = (incDonations || [])
      .filter((d:any) => d.status === 'success')
      .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
    setTotalCollected(sumCollected);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({ amount: 0, destination: "", description: "", proofUrl: "", donatedAt: new Date().toISOString(), transactionReference: "", hidden: false });
    setIsEditing(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id || item.persona || 'none');
    setFormData(item);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editingId && editingId !== 'none') {
      await updateRedistributionRecord(editingId, formData);
    } else {
      await createRedistributionRecord(formData);
    }
    setIsEditing(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteRedistributionRecord(id);
      if (editingId === id) setIsEditing(false);
      loadData();
    }
  };

  const handleEditPublicName = (donation: any) => {
    setEditingPublicNameId(donation.id);
    setEditingPublicNameValue(donation.publicName || '');
  };

  const handleSavePublicName = async (id: string) => {
    await updateDonationPublicName(id, editingPublicNameValue || null);
    setEditingPublicNameId(null);
    loadData();
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 text-neutral-300">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-[#222]">
        <h1 className="text-lg font-medium text-neutral-100 font-sans tracking-tight">Fund Records</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleCreateNew}
            className="bg-[#222] hover:bg-[#ff7700] hover:text-black hover:border-[#ff7700] text-neutral-200 border border-[#333] px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Record
          </button>
        </div>
      </div>

      {/* KPI Stats Panel - Space prepared for Razorpay integration */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-[#222] rounded p-4 flex flex-col justify-between">
           <div className="flex justify-between items-center mb-2">
             <span className="text-xs uppercase font-mono tracking-widest text-[#ff7700]">Collected (Est.)</span>
             <DollarSign className="w-4 h-4 text-neutral-600" />
           </div>
           <div>
             <div className="text-xl font-medium text-neutral-200 mb-1">₹ {totalCollected.toLocaleString()}</div>
             <div className="text-[10px] font-mono text-neutral-500">Live Razorpay sync incoming</div>
           </div>
        </div>
        
        <div className="bg-[#111] border border-[#222] rounded p-4 flex flex-col justify-between">
           <div className="flex justify-between items-center mb-2">
             <span className="text-xs uppercase font-mono tracking-widest text-emerald-500">Redirected</span>
             <ArrowRightLeft className="w-4 h-4 text-neutral-600" />
           </div>
           <div>
             <div className="text-xl font-medium text-neutral-200 mb-1">₹ {totalRedirected.toLocaleString()}</div>
             <div className="text-[10px] font-mono text-neutral-500">Manually logged distributions</div>
           </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded p-4 flex flex-col justify-between opacity-80">
           <div className="flex justify-between items-center mb-2">
             <span className="text-xs uppercase font-mono tracking-widest text-neutral-400">Balance</span>
             <Wallet className="w-4 h-4 text-neutral-600" />
           </div>
           <div>
             <div className="text-xl font-medium text-neutral-200 mb-1">₹ {(totalCollected - totalRedirected).toLocaleString()}</div>
             <div className="text-[10px] font-mono text-neutral-500">Available to redirect</div>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        <div>
          <h2 className="text-sm font-medium text-neutral-300 font-sans tracking-tight mb-4 uppercase">Recent Incoming Donations</h2>
          {donations.length === 0 ? (
            <div className="text-center py-8 text-neutral-600 font-sans text-sm border border-[#222] rounded border-dashed">
              No incoming donations found yet.
            </div>
          ) : (
            <div className="bg-[#111] border border-[#222] rounded overflow-x-auto">
              <table className="w-full text-left text-sm font-sans">
                <thead className="bg-[#1a1a1a] text-neutral-400 border-b border-[#222]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Raw Details</th>
                    <th className="px-4 py-3 font-medium">Public Name</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Tx ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-[#161616] transition-colors">
                      <td className="px-4 py-3 text-neutral-300">
                        {new Date(d.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        <div>{d.donorName || 'Anonymous'}</div>
                        {d.donorEmail && <div className="text-[10px] text-neutral-500">{d.donorEmail}</div>}
                        {d.donorPhone && <div className="text-[10px] text-neutral-500">{d.donorPhone}</div>}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {editingPublicNameId === d.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingPublicNameValue}
                              onChange={(e) => setEditingPublicNameValue(e.target.value)}
                              placeholder="e.g. Anonymous"
                              className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-sm outline-none focus:border-[#ff7700] text-neutral-200"
                            />
                            <button onClick={() => handleSavePublicName(d.id)} className="text-[#ff7700] hover:text-white"><Save className="w-4 h-4" /></button>
                            <button onClick={() => setEditingPublicNameId(null)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group min-h-[24px]">
                            <span className={d.publicName ? "text-neutral-200" : "text-neutral-500 italic"}>
                              {d.publicName || 'Pending Verification'}
                            </span>
                            <button onClick={() => handleEditPublicName(d)} className="text-neutral-600 hover:text-[#ff7700] opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        ₹ {Number(d.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded ${
                          d.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 font-mono text-[10px] truncate max-w-[120px]">
                        {d.razorpayPaymentId || d.razorpayOrderId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h2 className="text-xs uppercase font-mono tracking-widest text-neutral-400 font-semibold border-b border-[#222] pb-2">
            Redistribution Log
          </h2>
          
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id || idx} className={`bg-[#111] hover:bg-[#161616] border transition-colors rounded p-3 flex flex-col group ${item.hidden ? 'border-[#333]/50 opacity-60' : 'border-[#222] hover:border-[#333]'}`}>
                <div className="flex justify-between items-start gap-4 mb-2">
                   <div className="min-w-0">
                     <span className="text-xs font-mono tracking-widest uppercase text-[#ff7700] mb-1 block">
                       ₹ {Number(item.amount).toLocaleString()}
                     </span>
                     <h3 className="text-sm font-medium text-neutral-200 truncate">{item.destination || 'Unnamed Destination'}</h3>
                   </div>
                   <div className="flex items-center gap-2 shrink-0">
                     {item.hidden && <span title="Hidden from public"><EyeOff className="w-3.5 h-3.5 text-neutral-500" /></span>}
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleEdit(item)} className="p-1 hover:text-[#ff7700] text-neutral-500 transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                       </button>
                       <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-red-500 text-neutral-500 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   </div>
                </div>
                
                <div className="text-[11px] font-mono text-neutral-500 border-t border-[#222] pt-2 mt-1 flex justify-between">
                  <span>{item.donatedAt ? new Date(item.donatedAt).toLocaleDateString() : 'No date'}</span>
                  <span className="truncate max-w-50">{item.transactionReference || 'No Ref'}</span>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-neutral-500 font-mono bg-[#111] p-6 rounded border border-[#222] text-center">
                <p>No redistribution records found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel for Editing/Creating */}
        <div className="lg:col-span-5">
          {isEditing ? (
            <div className="bg-[#111] border border-[#222] rounded flex flex-col sticky top-6">
              <div className="flex justify-between items-center p-4 border-b border-[#222]">
                <h3 className="text-sm font-medium text-neutral-200">
                  {editingId ? 'Edit Record' : 'New Record'}
                </h3>
                <button onClick={() => setIsEditing(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1.5">Amount (₹)</label>
                    <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#ff7700]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1.5">Date</label>
                    <input type="datetime-local" value={formData.donatedAt ? new Date(formData.donatedAt).toISOString().slice(0, 16) : ''} onChange={(e) => setFormData({...formData, donatedAt: new Date(e.target.value).toISOString()})} className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#ff7700]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1.5">Destination (Recipient)</label>
                  <input type="text" value={formData.destination || ''} onChange={(e) => setFormData({...formData, destination: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#ff7700]" />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1.5">Category</label>
                  <input type="text" value={formData.category || 'Community'} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#ff7700]" />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1.5">Context / Description</label>
                  <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full h-24 bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#ff7700] resize-none"></textarea>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1.5">Proof / Receipt URL</label>
                  <input type="url" value={formData.proofUrl || ''} onChange={(e) => setFormData({...formData, proofUrl: e.target.value})} placeholder="https://..." className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#ff7700]" />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1.5">Transaction Ref (Internal)</label>
                  <input type="text" value={formData.transactionReference || ''} onChange={(e) => setFormData({...formData, transactionReference: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#ff7700]" />
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer mt-2 pt-4 border-t border-[#222]">
                  <input type="checkbox" checked={formData.hidden || false} onChange={e => setFormData({...formData, hidden: e.target.checked})} className="accent-[#ff7700]" />
                  <span className="text-xs font-mono text-neutral-400">Hide from public timeline</span>
                </label>
              </div>

              <div className="p-4 border-t border-[#222] bg-[#161616] rounded-b flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium bg-[#222] hover:bg-[#333] text-neutral-300 rounded transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-[#ff7700] hover:bg-[#ff8822] text-black rounded flex items-center gap-1.5 transition-colors">
                  <Save className="w-3.5 h-3.5" />
                  Save Record
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#111] border border-[#222] border-dashed rounded p-8 flex flex-col items-center justify-center text-center text-neutral-500 h-64 sticky top-6">
              <Wallet className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm">Select a record to edit or create a new one.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
