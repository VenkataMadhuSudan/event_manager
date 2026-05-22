"use client";

import { useEffect, useState, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Search,
  Users,
  Download,
  CheckCircle2,
  Clock,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Mail,
  Send
} from 'lucide-react';
import { sendFormalConfirmationEmail } from '@/lib/email';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { Skeleton } from '@/components/ui/Skeleton';

export default function HostManageEventPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (slug) fetchEventData();
  }, [slug]);

  const fetchEventData = async () => {
    try {
      const res = await fetch(`/api/host/events/${slug}`);
      if (res.status === 401 || res.status === 403) {
        toast.error("Unauthorized");
        router.push('/my-events');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
        setRegistrations(data.registrations || []);
      } else {
        toast.error("Event not found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/host/events/${slug}/registrations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success("Registration deleted");
        setRegistrations(prev => prev.filter(r => r.id !== id));
        // Also remove from selected if present
        setSelectedParticipants(prev => {
          prev.delete(id);
          return new Set(prev);
        });
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    }
  };

  const toggleParticipantSelection = (id: string) => {
    setSelectedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isParticipantSelected = (id: string) => selectedParticipants.has(id);

  const handleSendEmail = async () => {
    if (selectedParticipants.size === 0) {
      toast.error("Please select at least one participant");
      return;
    }

    setEmailSending(true);
    setEmailResult(null);

    try {
      const res = await fetch(`/api/host/events/${slug}/registrations/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: Array.from(selectedParticipants) })
      });

      const data = await res.json();

      if (data.success) {
        setEmailResult({ success: true, message: data.message });
        toast.success(data.message);
        // Clear selection after successful send
        setSelectedParticipants(new Set());
      } else {
        setEmailResult({ success: false, message: data.message });
        toast.error(data.message || "Failed to send emails");
      }
    } catch (error) {
      setEmailResult({ success: false, message: "Network error" });
      console.error(error);
      toast.error("Network error sending emails");
    } finally {
      setEmailSending(false);
    }
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = registrations.map(reg => ({
      'Name': reg.name,
      'Email': reg.email,
      'Phone': reg.phone,
      'Participants': reg.participants,
      'Status': reg.status,
      'Checked In': reg.checked_in ? 'Yes' : 'No',
      'Checked In At': reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString() : 'N/A',
      'Registration Date': new Date(reg.created_at).toLocaleString()
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event?.name || 'Event'}_Registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export started");
  };

  const analytics = useMemo(() => {
    const total = registrations.length;
    const checkedIn = registrations.filter(r => r.checked_in).length;
    const pending = total - checkedIn;
    const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    
    return { total, checkedIn, pending, checkInRate };
  }, [registrations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <header className="bg-white border-b px-8 py-6 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Skeleton className="w-12 h-12" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-12" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-8 border-l-[10px] border-gray-100 shadow-xl space-y-4">
                <div className="flex justify-between"><Skeleton className="h-6 w-6" /><Skeleton className="h-2 w-12" /></div>
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-16 w-96" />
            </div>
            <div className="bg-white p-6 space-y-4 shadow-xl">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 border-b pb-4">
                  <Skeleton className="h-12 w-1/4" />
                  <Skeleton className="h-12 w-1/4" />
                  <Skeleton className="h-12 w-1/6" />
                  <Skeleton className="h-12 w-1/6" />
                  <Skeleton className="h-12 w-1/6" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }  if (!event) return null;

  const filteredRegistrations = registrations.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-transparent pb-24">
      {/* Dynamic Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b px-8 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link 
              href="/my-events" 
              className="p-3 bg-gray-900 text-white hover:bg-sky-600 transition-all shadow-lg shadow-gray-900/10 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-sky-100 text-sky-600 text-[10px] font-black uppercase tracking-widest">Live Dashboard</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">{event.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-900 text-gray-900 font-black uppercase tracking-widest text-xs hover:bg-gray-900 hover:text-white transition-all active:scale-95 shadow-xl"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleSendEmail}
              disabled={emailSending || selectedParticipants.size === 0}
              className={`flex items-center gap-2 px-6 py-3 bg-white border-2 border-sky-500 text-sky-800 font-black uppercase tracking-widest text-xs hover:bg-sky-500 hover:text-white transition-all active:scale-95 shadow-xl ${emailSending || selectedParticipants.size === 0 ? 'opacity-50' : ''}`}
            >
              {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" /> }
              {emailSending ? "Sending..." : `Send Email (${selectedParticipants.size})`}
            </button>
            {emailResult && (
              <div className={`flex items-center gap-2 p-3 px-4 rounded-lg ${emailResult.success ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                {emailResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                <span className="text-xs font-medium">{emailResult.message}</span>
              </div>
            )}
            <Link
              href={`/event/${event.slug}`}
              target="_blank"
              className="p-3 bg-sky-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-sky-600/20"
            >
              <ExternalLink className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 border-l-[10px] border-sky-600 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-6 h-6 text-sky-600" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter mb-1">{analytics.total}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Registered Participants</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 border-l-[10px] border-blue-500 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-6 h-6 text-blue-500" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Checked In</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter mb-1">{analytics.checkedIn}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{analytics.checkInRate}% Success Rate</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 border-l-[10px] border-amber-500 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-6 h-6 text-amber-500" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter mb-1">{analytics.pending}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Waiting for check-in</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 border-l-[10px] border-gray-900 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-6 h-6 text-gray-900" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter mb-1 uppercase italic">{event.status}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Event Current State</p>
          </motion.div>
        </div>

        {/* Search & List Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Participant <span className="text-sky-600">Directory</span></h2>
            <div className="w-full max-w-md relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-sky-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Filter by name, email or phone..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-white border-4 border-gray-100 focus:border-sky-600 outline-none transition-all font-black uppercase tracking-tighter placeholder:text-gray-300 shadow-xl"
              />
            </div>
          </div>

          <div className="bg-white shadow-2xl overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]" />
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Participant Info</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Contact Details</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Team Size</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Reg. Date</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((reg: any, idx: number) => (
                        <motion.tr
                          key={reg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          <td className="p-6">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isParticipantSelected(reg.id)}
                                onChange={() => toggleParticipantSelection(reg.id)}
                                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                              />
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="font-black text-gray-900 uppercase tracking-tighter text-lg mb-0.5">{reg.name}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              ID: {reg.id.split('-')[0]}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="text-sm font-bold text-gray-700">{reg.email}</div>
                            <div className="text-xs font-medium text-gray-500 mt-1">{reg.phone}</div>
                          </td>
                          <td className="p-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 font-black text-xs">
                              <Users className="w-3 h-3" />
                              {reg.participants}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col gap-1">
                              <span className={cn(
                                "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest w-fit",
                                reg.checked_in ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {reg.checked_in ? "CHECKED IN" : "PENDING"}
                              </span>
                              {reg.checked_in_at && (
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                  @ {new Date(reg.checked_in_at).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                              {new Date(reg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            <button
                              onClick={() => handleDeleteRegistration(reg.id)}
                              className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              title="Remove Registration"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <div className="flex flex-col items-center opacity-30">
                            <Search className="w-12 h-12 mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.4em]">No matching entries found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Footer Overlay */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-12 py-6 shadow-2xl flex items-center gap-12 z-50 pointer-events-none"
      >
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">Synced</span>
          <span className="text-xs font-bold">Real-time</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-xl font-black italic tracking-tighter">{analytics.total}</span>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Base</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-black italic tracking-tighter text-blue-400">{analytics.checkedIn}</span>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </motion.div>
  );
}