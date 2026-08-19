'use client';

'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Eye, EyeOff, Star } from 'lucide-react';
import { getFieldNotes, createFieldNote, updateFieldNote, deleteFieldNote, hideFieldNote, unhideFieldNote, featureFieldNote, unfeatureFieldNote } from '@/app/admin/actions/fieldNotes.actions';

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

export default function FieldNotePage() {
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({"title":"","excerpt":"","content":"","category":"","publishedAt":"","featured":false,"hidden":false,"draft":false});

  const loadData = async () => {
    const data = await getFieldNotes();
    setItems(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({"title":"","excerpt":"","content":"","category":"","publishedAt":"","featured":false,"hidden":false,"draft":false});
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
      await updateFieldNote(editingId, formData);
    } else {
      await createFieldNote(formData);
    }
    setIsEditing(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteFieldNote(id);
      if (editingId === id) setIsEditing(false);
      loadData();
    }
  };

  const toggleVisibility = async (item: any) => {
    // some use 'hidden', some use 'active' - adjust based on your object properties
    const isCurrentlyHidden = item.hidden === true;
    if (isCurrentlyHidden) {
      await unhideFieldNote(item.id || item.persona);
    } else {
      await hideFieldNote(item.id || item.persona);
    }
    loadData();
  };

  const toggleFeature = async (item: any) => {
    if (item.featured) {
      await unfeatureFieldNote(item.id || item.persona);
    } else {
      await featureFieldNote(item.id || item.persona);
    }
    loadData();
  };


  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">Field Notes</h1>
          <p className="text-muted-text text-sm">Manage field notes for the site.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-primary text-background px-4 py-2.5 rounded-md text-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          New Item
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-muted-text font-semibold font-mono w-[80%]">Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-muted-text font-semibold font-mono text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-muted group transition-colors">
                  <td className="px-6 py-4">

                    <div className="flex flex-col gap-1.5">
                      <p className="font-medium text-foreground text-sm pr-4 line-clamp-1">{String(item['title'] || 'Unnamed Item')}</p>
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
                      <button onClick={() => toggleFeature(item)} className={`p-1.5 rounded transition-colors ${item.featured ? 'text-amber-400 hover:bg-amber-400/10' : 'text-muted-text hover:text-foreground hover:bg-muted'}`} title="Toggle Feature"><Star className="w-4 h-4" /></button>
                      <button onClick={() => toggleVisibility(item)} className="p-1.5 text-muted-text hover:text-foreground hover:bg-muted rounded transition-colors" title="Toggle Visibility">{item.hidden === true ? <EyeOff className="w-4 h-4 text-neutral-600" /> : <Eye className="w-4 h-4" />}</button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-muted-text hover:text-foreground hover:bg-muted rounded transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id || item.persona)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-muted rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-muted-text">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && (
        <div className="mt-12 border-t border-border pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium tracking-tight text-foreground">
              {editingId ? 'Edit Item' : 'New Item'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-surface text-heading hover:bg-muted border border-border"
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

          <div className="space-y-6 bg-surface p-6 rounded-lg border border-border">

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-text font-mono mb-2">Title</label>
                <input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground outline-none focus:border-border" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-text font-mono mb-2">Excerpt</label>
                <textarea value={formData.excerpt || ''} onChange={(e) => setFormData({...formData, excerpt: e.target.value})} className="w-full h-32 bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground outline-none focus:border-border resize-none"></textarea>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-text font-mono mb-2">Content</label>
                <textarea value={formData.content || ''} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full h-32 bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground outline-none focus:border-border resize-none"></textarea>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-text font-mono mb-2">Category</label>
                <input type="text" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground outline-none focus:border-border" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-text font-mono mb-2">Published At</label>
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
                  className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground outline-none focus:border-border scheme-dark"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-text font-mono mb-2">Featured</label>
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.featured || false} onChange={(e) => setFormData({...formData, featured: e.target.checked})} className="bg-muted border-border rounded" /></div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-text font-mono mb-2">Hidden</label>
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.hidden || false} onChange={(e) => setFormData({...formData, hidden: e.target.checked})} className="bg-muted border-border rounded" /></div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-text font-mono mb-2">Draft</label>
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.status === 'draft' || false} onChange={(e) => setFormData({...formData, status: e.target.checked ? 'draft' : 'published'})} className="bg-muted border-border rounded" /></div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
