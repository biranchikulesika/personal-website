'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Eye, EyeOff, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { getNewsletterIssues, createNewsletterIssue, updateNewsletterIssue, deleteNewsletterIssue, hideNewsletterIssue, unhideNewsletterIssue } from '@/app/admin/actions/newsletterIssues.actions';
import { FormLabel, InlineError, ValidationSummary, parseDbError, InlineWarning } from '@/components/admin/validation';

function formatToDatetimeLocal(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export default function NewsletterIssuePage() {
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({"persona":"","title":"","content":"","publishedAt":"","hidden":false});

  const loadData = async () => {
    const data = await getNewsletterIssues();
    setItems(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setDbError(null);
    setFormData({"persona":"","title":"","content":"","publishedAt":"","hidden":false});
    setIsEditing(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id || item.persona || 'none');
    setDbError(null);
    setFormData(item);
    setIsEditing(true);
  };

  const errors: Record<string, string> = {};
  if (!formData.persona?.trim()) {
    errors.persona = "Persona context is required.";
  }
  if (!formData.title?.trim()) {
    errors.title = "Issue Title is required.";
  }
  if (!formData.content?.trim()) {
    errors.content = "Issue Content cannot be empty.";
  }

  const warnings: string[] = [];
  if (!formData.publishedAt?.trim()) {
    warnings.push("No publication schedule date provided. It will publish immediately.");
  }

  const isValid = Object.keys(errors).length === 0;

  const handleSave = async () => {
    if (!isValid) return;
    setDbError(null);
    try {
      if (editingId && editingId !== 'none') {
        await updateNewsletterIssue(editingId, formData);
      } else {
        await createNewsletterIssue(formData);
      }
      setIsEditing(false);
      loadData();
    } catch (err: any) {
      setDbError(parseDbError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteNewsletterIssue(id);
      if (editingId === id) setIsEditing(false);
      loadData();
    }
  };

  const toggleVisibility = async (item: any) => {
    // some use 'hidden', some use 'active' - adjust based on your object properties
    const isCurrentlyHidden = item.hidden === true;
    if (isCurrentlyHidden) {
      await unhideNewsletterIssue(item.id || item.persona);
    } else {
      await hideNewsletterIssue(item.id || item.persona);
    }
    loadData();
  };


  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">Newsletter Issues</h1>
          <p className="text-neutral-500 text-sm">Manage newsletter issues for the site.</p>
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
                      <p className="font-medium text-neutral-200 text-sm pr-4 line-clamp-1">{String(item['persona'] || 'Unnamed Item')}</p>
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
                      <button onClick={() => toggleVisibility(item)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Toggle Visibility">{item.hidden === true ? <EyeOff className="w-4 h-4 text-neutral-600" /> : <Eye className="w-4 h-4" />}</button>
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
          {Object.keys(errors).length > 0 && isEditing && (
            <ValidationSummary errors={errors} title="Invalid Newsletter Issue" />
          )}

          {dbError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs rounded-md">
              ⚠️ {dbError}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium tracking-tight text-neutral-100">
              {editingId ? 'Edit Item' : 'New Item'}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-[#111111] text-[#b3b3b3] hover:bg-[#1a1a1a] border border-[#222]"
              >
                Cancel
              </button>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleSave}
                  disabled={!isValid}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    isValid
                      ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
                      : 'bg-neutral-800 text-neutral-500 opacity-50 cursor-not-allowed border border-[#222]'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                {!isValid && (
                  <span className="text-[10px] text-neutral-500 font-mono">Complete required fields to save.</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-[#111111] p-6 rounded-lg border border-[#1a1a1a]">

              <div>
                <FormLabel label="Persona" required />
                <input
                  type="text"
                  value={formData.persona || ''}
                  onChange={(e) => setFormData({...formData, persona: e.target.value})}
                  placeholder="e.g. builder, wanderer, operator, thinker"
                  className={`w-full bg-[#161616] border rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 ${
                    !formData.persona?.trim() ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#222]'
                  }`}
                />
                <InlineError message={!formData.persona?.trim() ? 'Persona context is required.' : undefined} />
              </div>
              <div>
                <FormLabel label="Title" required />
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full bg-[#161616] border rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 ${
                    !formData.title?.trim() ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#222]'
                  }`}
                />
                <InlineError message={!formData.title?.trim() ? 'Issue Title is required.' : undefined} />
              </div>
              <div>
                <FormLabel label="Content" required />
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className={`w-full h-32 bg-[#161616] border rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 resize-none ${
                    !formData.content?.trim() ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#222]'
                  }`}
                ></textarea>
                <InlineError message={!formData.content?.trim() ? 'Issue Content cannot be empty.' : undefined} />
              </div>
              <div>
                <FormLabel label="Published At" />
                <input
                  type="datetime-local"
                  value={formatToDatetimeLocal(formData.publishedAt)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setFormData({ ...formData, publishedAt: '' });
                    } else {
                      try {
                        const iso = new Date(val).toISOString();
                        setFormData({ ...formData, publishedAt: iso });
                      } catch {
                        setFormData({ ...formData, publishedAt: val });
                      }
                    }
                  }}
                  className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 scheme-dark"
                />
                <InlineWarning message={!formData.publishedAt?.trim() ? "No publication schedule date provided. It will publish immediately." : undefined} />
              </div>
              <div>
                <FormLabel label="Hidden" />
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.hidden || false} onChange={(e) => setFormData({...formData, hidden: e.target.checked})} className="bg-[#161616] border-[#222] rounded" /></div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
