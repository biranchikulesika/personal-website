'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, EyeOff, Eye, Save, X, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, hideQuestion, unhideQuestion, moveQuestionUp, moveQuestionDown } from '@/app/admin/actions/questions.actions';
import { FormLabel, InlineError, ValidationSummary, parseDbError } from '@/components/admin/validation';

export default function QuestionPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    text: '',
    order: 0,
    hidden: false
  });

  const loadData = async () => {
    let data = await getQuestions();
    if (data) {
      data = data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }
    setQuestions(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setDbError(null);
    setFormData({ text: '', order: questions.length, hidden: false });
    setIsEditing(true);
  };

  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setDbError(null);
    setFormData({
      text: q.text || '',
      order: q.order || 0,
      hidden: !!q.hidden
    });
    setIsEditing(true);
  };

  const errors: Record<string, string> = {};
  if (!formData.text.trim()) {
    errors.text = 'Question text is required.';
  }
  const isValid = Object.keys(errors).length === 0;

  const handleSave = async () => {
    if (!isValid) return;
    setDbError(null);
    try {
      if (editingId) {
        await updateQuestion(editingId, formData);
      } else {
        await createQuestion(formData);
      }
      setIsEditing(false);
      loadData();
    } catch (err: any) {
      setDbError(parseDbError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      await deleteQuestion(id);
      if (editingId === id) setIsEditing(false);
      loadData();
    }
  };

  const toggleVisibility = async (item: any) => {
    // some use 'hidden', some use 'active' - adjust based on your object properties
    const isCurrentlyHidden = item.hidden === true;
    if (isCurrentlyHidden) {
      await unhideQuestion(item.id || item.persona);
    } else {
      await hideQuestion(item.id || item.persona);
    }
    loadData();
  };


  const moveUp = async (item: any) => {
    await moveQuestionUp(item.id);
    loadData();
  };
  const moveDown = async (item: any) => {
    await moveQuestionDown(item.id);
    loadData();
  };

  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">Questions</h1>
          <p className="text-neutral-500 text-sm">Manage questions for the site.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-neutral-100 text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          New Question
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-neutral-500 transition-colors placeholder-neutral-600 text-neutral-200"
          />
        </div>
        <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          <button className="whitespace-nowrap px-4 py-2 rounded-lg text-sm border font-medium transition-colors bg-neutral-800 text-neutral-100 border-neutral-700">
            All
          </button>
          <button className="whitespace-nowrap px-4 py-2 rounded-lg text-sm border font-medium transition-colors bg-transparent text-neutral-500 border-[#1a1a1a] hover:border-neutral-600 hover:bg-[#111111]">
            Recent
          </button>
        </div>
      </div>

      <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[60%]">Item Name</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {questions.map((q, idx) => (
                <tr key={q.id} className="hover:bg-[#161616] group transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-neutral-200 text-sm pr-4 line-clamp-1">{q.text}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${q.active ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
                      <span className="text-xs font-medium text-neutral-400">{q.active ? 'Active' : 'Hidden'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveUp(q)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Move Up"><ArrowUp className="w-4 h-4" /></button>
                      <button onClick={() => moveDown(q)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Move Down"><ArrowDown className="w-4 h-4" /></button>
                      <button onClick={() => toggleVisibility(q)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Toggle Visibility">{q.hidden === true ? <EyeOff className="w-4 h-4 text-neutral-600" /> : <Eye className="w-4 h-4" />}</button>
                      <button onClick={() => handleEdit(q)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(q.id)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-[#222] rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No questions found.
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
            <ValidationSummary errors={errors} title="Invalid Question" />
          )}

          {dbError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs rounded-md">
              ⚠️ {dbError}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium tracking-tight text-neutral-100">
              {editingId ? 'Edit Question' : 'New Question'}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-[#111111] text-neutral-300 hover:bg-[#1a1a1a] border border-[#222]"
              >
                Cancel
              </button>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleSave}
                  disabled={!isValid}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 bg-[#111111] p-6 rounded-lg border border-[#1a1a1a]">
              <div>
                <FormLabel label="Question Text" required />
                <input
                  type="text"
                  value={formData.text}
                  onChange={(e) => setFormData({...formData, text: e.target.value})}
                  className={`w-full bg-[#161616] border rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 ${
                    errors.text ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#222]'
                  }`}
                />
                <InlineError message={errors.text} />
              </div>
              <div>
                <FormLabel label="Order Index" />
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                  className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#111111] p-6 rounded-lg border border-[#1a1a1a] space-y-6">
                <div>
                  <FormLabel label="Status" />
                  <select
                    value={!formData.hidden ? 'active' : 'hidden'}
                    onChange={(e) => setFormData({...formData, hidden: e.target.value !== 'active'})}
                    className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500"
                  >
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
