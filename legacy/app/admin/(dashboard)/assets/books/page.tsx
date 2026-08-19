'use client';

'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Eye, EyeOff, Star } from 'lucide-react';
import { getBooks, createBook, updateBook, deleteBook, hideBook, unhideBook, featureBook, unfeatureBook } from '@/app/admin/actions/books.actions';
import { FormLabel, InlineError, ValidationSummary, parseDbError } from '@/components/admin/validation';

export default function BooksAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required.";
    if (!formData.author?.trim()) newErrors.author = "Author is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      if (formData.id) {
        await updateBook(formData.id, formData);
      } else {
        await createBook(formData);
      }
      setIsEditing(false);
      setFormData({});
      loadData();
    } catch (e: any) {
      setSubmitError(parseDbError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this book?")) {
      await deleteBook(id);
      loadData();
    }
  };

  const toggleVisibility = async (item: any) => {
    if (item.hidden) await unhideBook(item.id);
    else await hideBook(item.id);
    loadData();
  };

  const toggleFeature = async (item: any) => {
    if (item.featured) await unfeatureBook(item.id);
    else await featureBook(item.id);
    loadData();
  };

  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12 text-heading">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">Books</h1>
        </div>
        {!isEditing && (
          <button onClick={() => { setFormData({ status: 'reading' }); setIsEditing(true); setErrors({}); }} className="bg-neutral-100 hover:bg-white text-black px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Book
          </button>
        )}
      </div>

      {isEditing && (
        <div className="bg-surface/80 backdrop-blur-md border border-border rounded-xl p-6 md:p-8 mb-10 shadow-xl">
          <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
            <h2 className="text-xl font-medium text-foreground">{formData.id ? 'Edit Book' : 'New Book'}</h2>
            <button onClick={() => setIsEditing(false)} className="text-muted-text hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <FormLabel label="Title" required />
              <input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className={`w-full bg-background border ${errors.title ? 'border-red-500' : 'border-border'} rounded-md p-3 text-foreground`} placeholder="Book Title" />
              <InlineError message={errors.title} />
            </div>
            <div>
              <FormLabel label="Author" required />
              <input type="text" value={formData.author || ''} onChange={(e) => setFormData({...formData, author: e.target.value})} className={`w-full bg-background border ${errors.author ? 'border-red-500' : 'border-border'} rounded-md p-3 text-foreground`} placeholder="Author Name" />
              <InlineError message={errors.author} />
            </div>
          </div>

          {((errors ? Object.keys(errors).length : 0) > 0 || submitError) && (
            <ValidationSummary errors={errors} warnings={submitError ? [submitError] : undefined} title="Invalid Book Entry" />
          )}

          <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-md text-sm font-medium text-body hover:text-foreground">Cancel</button>
            <button onClick={handleSave} disabled={isSubmitting} className="bg-white text-black hover:bg-neutral-200 px-6 py-2.5 rounded-md text-sm font-medium flex items-center gap-2">
              <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Book'}
            </button>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="p-4 text-xs font-mono tracking-wider text-muted-text uppercase">Title</th>
                  <th className="p-4 text-xs font-mono tracking-wider text-muted-text uppercase">Author</th>
                  <th className="p-4 text-xs font-mono tracking-wider text-muted-text uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className={`hover:bg-muted transition-colors ${item.hidden ? 'opacity-50' : ''}`}>
                    <td className="p-4"><p className="font-medium text-foreground text-sm line-clamp-1">{item.title}</p></td>
                    <td className="p-4 text-sm text-body">{item.author}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleFeature(item)} className={`p-2 rounded-md ${item.featured ? 'text-yellow-500' : 'text-muted-text'} hover:bg-muted`}><Star className="w-4 h-4" /></button>
                        <button onClick={() => toggleVisibility(item)} className="p-2 rounded-md text-muted-text hover:text-foreground hover:bg-muted">
                          {item.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setFormData(item); setIsEditing(true); setErrors({}); }} className="p-2 rounded-md text-muted-text hover:text-foreground hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 rounded-md text-muted-text hover:text-red-500 hover:bg-muted"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(items?.length || 0) === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted-text italic">No books found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
