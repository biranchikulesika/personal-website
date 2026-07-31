'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Eye, EyeOff, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { getOperatorFocuss, createOperatorFocus, updateOperatorFocus, deleteOperatorFocus, moveOperatorFocusUp, moveOperatorFocusDown } from '@/app/admin/actions/operatorFocuses.actions';

export default function OperatorFocusPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({"label":"","value":"","order":0});

  const loadData = async () => {
    const data = await getOperatorFocuss();
    setItems(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({"label":"","value":"","order":0});
    setIsEditing(true);
  };

  const handleEdit = (item: any) => {
    // If it's a singleton profile it acts via ID or just updates the single one
    setEditingId(item.id || item.persona || 'none');
    setFormData(item);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editingId && editingId !== 'none') {
      await updateOperatorFocus(editingId, formData);
    } else {
      await createOperatorFocus(formData);
    }
    setIsEditing(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteOperatorFocus(id);
      if (editingId === id) setIsEditing(false);
      loadData();
    }
  };


  const moveUp = async (item: any) => {
    await moveOperatorFocusUp(item.id);
    loadData();
  };
  const moveDown = async (item: any) => {
    await moveOperatorFocusDown(item.id);
    loadData();
  };


  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">Operator Focus</h1>
          <p className="text-neutral-500 text-sm">Manage operator focus for the site.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-neutral-100 text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          New Item
        </button>
      </div>

      <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[80%]">Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-[#161616] group transition-colors">
                  <td className="px-6 py-4">

                    <div className="flex flex-col gap-1.5">
                      <p className="font-medium text-neutral-200 text-sm pr-4 line-clamp-1">{String(item['label'] || 'Unnamed Item')}</p>
                      <div className="flex flex-wrap gap-1">
                        {(item.hidden === true) && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-[#ff7700]/10 text-[#ff7700]">Hidden</span>}
                        {(item.hidden === false) && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-emerald-500/10 text-emerald-500">Visible</span>}
                        {item.featured && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-amber-400/10 text-amber-400">Featured</span>}
                        {item.status === 'draft' && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-neutral-500/10 text-neutral-400">Draft</span>}
                        {item.status === 'published' && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-blue-500/10 text-blue-400">Published</span>}
                      </div>
                    </div>

                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveUp(item)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Move Up"><ArrowUp className="w-4 h-4" /></button>
                      <button onClick={() => moveDown(item)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Move Down"><ArrowDown className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id || item.persona)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-[#222] rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && (
        <div className="mt-12 border-t border-[#1a1a1a] pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium tracking-tight text-neutral-100">
              {editingId ? 'Edit Item' : 'New Item'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-[#111111] text-neutral-300 hover:bg-[#1a1a1a] border border-[#222]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-black hover:bg-neutral-200 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>

          <div className="space-y-6 bg-[#111111] p-6 rounded-lg border border-[#1a1a1a]">

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 font-mono mb-2">Label</label>
                <input type="text" value={formData.label || ''} onChange={(e) => setFormData({...formData, label: e.target.value})} className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 font-mono mb-2">Value</label>
                <textarea value={formData.value || ''} onChange={(e) => setFormData({...formData, value: e.target.value})} className="w-full h-32 bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 resize-none"></textarea>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 font-mono mb-2">Order</label>
                <input type="number" value={formData.order || 0} onChange={(e) => setFormData({...formData, order: parseFloat(e.target.value) || 0})} className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
