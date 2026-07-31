'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSubscriptions, saveSubscription } from '@/app/admin/actions/subscriptions.actions';
import { Subscription } from '@/lib/types';
import { Search, Download, Ban } from 'lucide-react';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterPersona, setFilterPersona] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getSubscriptions();
    setSubscriptions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchSearch = sub.subscriberId.toLowerCase().includes(search.toLowerCase());
      const matchActive = filterActive === 'all' ? true : filterActive === 'active' ? sub.active : !sub.active;
      const matchPersona = filterPersona === 'all' ? true : sub.persona === filterPersona;
      return matchSearch && matchActive && matchPersona;
    });
  }, [subscriptions, search, filterActive, filterPersona]);

  const personas = useMemo(() => {
    const p = new Set(subscriptions.map(s => s.persona));
    return Array.from(p);
  }, [subscriptions]);

  const handleUnsubscribe = async (sub: Subscription) => {
    if (!sub.active) return;
    if (!confirm('Are you sure you want to forcibly unsubscribe this record?')) return;
    await saveSubscription(sub.id, { ...sub, active: false });
    loadData();
  };

  const exportCSV = () => {
    const headers = ['id', 'subscriberId', 'persona', 'active', 'createdAt', 'updatedAt'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(s => [
        s.id, s.subscriberId, s.persona, s.active, s.createdAt, s.updatedAt
      ].join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'subscriptions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-serif">Subscriptions</h1>
        <button onClick={exportCSV} className="flex items-center px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            placeholder="Search Subscriber ID..." 
            className="pl-9 w-full p-2 border rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="p-2 border rounded-md min-w-45">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={filterPersona} onChange={(e) => setFilterPersona(e.target.value)} className="p-2 border rounded-md min-w-45">
          <option value="all">All Personas</option>
          {personas.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-md shadow border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="p-4 font-medium">Subscriber ID</th>
                <th className="p-4 font-medium">Persona</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Subscribed</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4"><div className="h-5 w-32 bg-primary/10 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-20 bg-primary/10 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-16 bg-primary/10 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-24 bg-primary/10 rounded animate-pulse" /></td>
                    <td className="p-4 text-right"><div className="h-5 w-20 bg-primary/10 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center">No subscriptions found.</td></tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className="border-t">
                    <td className="p-4 font-mono text-xs">{sub.subscriberId}</td>
                    <td className="p-4 capitalize">{sub.persona}</td>
                    <td className="p-4">
                      {sub.active ? (
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-200">Active</span>
                      ) : (
                        <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">Inactive</span>
                      )}
                    </td>
                    <td className="p-4">{formatDate(sub.createdAt)}</td>
                    <td className="p-4 text-right">
                      {sub.active && (
                        <button className="text-red-500 hover:text-red-700 flex items-center justify-end w-full" onClick={() => handleUnsubscribe(sub)}>
                          <Ban className="w-4 h-4 mr-2" />
                          Unsubscribe
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
