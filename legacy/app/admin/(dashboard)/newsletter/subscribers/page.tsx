'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSubscribers } from '@/app/admin/actions/subscribers.actions';
import { Subscriber } from '@/lib/types';
import { Search, Download, CheckCircle2, XCircle } from 'lucide-react';

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getSubscribers();
    setSubscribers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()));
  }, [subscribers, search]);

  const exportCSV = () => {
    const headers = ['id', 'email', 'isVerified', 'createdAt', 'updatedAt'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(s => [
        s.id, s.email, s.isVerified, s.createdAt, s.updatedAt
      ].join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'subscribers.csv');
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
        <h1 className="text-3xl font-bold font-serif">Subscribers</h1>
        <button onClick={exportCSV} className="flex items-center px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            placeholder="Search email..." 
            className="pl-9 w-full p-2 border rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-md shadow border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Verified</th>
                <th className="p-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4"><div className="h-5 w-48 bg-primary/10 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-8 bg-primary/10 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-24 bg-primary/10 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="p-4 text-center">No subscribers found.</td></tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className="border-t">
                    <td className="p-4">{sub.email}</td>
                    <td className="p-4">
                      {sub.isVerified ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                    <td className="p-4">{formatDate(sub.createdAt)}</td>
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

