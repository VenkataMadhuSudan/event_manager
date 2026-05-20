"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2, 
  Calendar, 
  Plus, 
  XCircle, 
  Pencil, 
  Save, 
  X,
  LayoutGrid,
  Link2,
  Settings2,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";

type Event = {
  id: string;
  name: string;
  slug: string;
  status: string;
  event_date?: string;
  end_date?: string;
  last_date_to_register?: string;
  type?: string;
  duration?: string;
  venue?: string;
  details?: string;
  mode?: string;
  is_paid?: boolean;
  max_attendees?: number;
  team_size?: number;
  banner_url?: string;
  poster_url?: string;
  theme_color?: string;
  created_at: string;
};

export default function EventsAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const json = await res.json();
      if (json.success) {
        setEvents(json.events);
      } else {
        toast.error("Failed to load events");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the event and ALL associated registrations permanently.")) return;
    
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Event and all registrations deleted");
        setEvents(e => e.filter(evt => evt.id !== id));
      } else {
        toast.error("Failed to delete event");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEvent)
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Event updated successfully");
        setEvents(prev => prev.map(evt => evt.id === editingEvent.id ? json.event : evt));
        setIsEditModalOpen(false);
        setEditingEvent(null);
      } else {
        toast.error(json.error || "Failed to update event");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this event? This will also cancel all registrations.")) return;

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Event and registrations cancelled");
        setEvents(e => e.map(evt => evt.id === id ? { ...evt, status: "CANCELLED" } : evt));
      } else {
        toast.error("Failed to cancel event");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleEditClick = (event: Event) => {
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "";
      return new Date(dateStr).toISOString().split('T')[0];
    };

    setEditingEvent({
      ...event,
      event_date: formatDate(event.event_date),
      end_date: formatDate(event.end_date),
      last_date_to_register: formatDate(event.last_date_to_register),
    });
    setIsEditModalOpen(true);
  };

  const copyToClipboard = (slug: string) => {
    const url = `${origin}/event/${slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopiedSlug(slug);
          toast.success("Link copied!");
          setTimeout(() => setCopiedSlug(null), 2000);
        });
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      e.name.toLowerCase().includes(search.toLowerCase()) || 
      e.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-4 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Dashboard</span>
          </Link>
          <h1 className="text-5xl font-black text-black dark:text-white tracking-tighter uppercase italic">Event <span className="text-sky-600">Repository</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium flex items-center gap-2 uppercase text-xs tracking-widest">
            <LayoutGrid className="w-4 h-4" /> Global Catalog Management
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link 
            href="/"
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-none hover:opacity-90 font-black transition-all shadow-xl uppercase tracking-widest text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Link>
        </motion.div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by event name or slug..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-8 py-4">Event Identity</th>
                <th className="px-8 py-4">Deployment Status</th>
                <th className="px-8 py-4">Portal Access</th>
                <th className="px-8 py-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-8 py-6">
                        <Skeleton className="h-10 w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <p className="font-black uppercase tracking-widest text-xs text-zinc-400 italic">No events found in current deployment.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event, i) => (
                    <motion.tr 
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-black text-black dark:text-white text-lg block tracking-tighter uppercase italic leading-none mb-1">{event.name}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Created {new Date(event.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 ${
                          event.status === 'CANCELLED' 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {event.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 shadow-sm w-fit group-hover:border-sky-400 transition-colors">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">/{event.slug}</span>
                          <div className="h-4 w-[1px] bg-zinc-200 mx-1"></div>
                          <button onClick={() => copyToClipboard(event.slug)} className="p-1 hover:text-sky-600">
                            {copiedSlug === event.slug ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <Link href={`/event/${event.slug}`} target="_blank" className="p-1 hover:text-sky-600">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {event.status !== 'CANCELLED' && (
                            <>
                              <button onClick={() => handleEditClick(event)} className="p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all border border-zinc-200 dark:border-zinc-700">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleCancel(event.id)} className="p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white transition-all border border-zinc-200 dark:border-zinc-700">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDelete(event.id)} className="p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-red-500 hover:text-white transition-all border border-zinc-200 dark:border-zinc-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-black dark:border-white shadow-[30px_30px_0px_0px_rgba(0,0,0,0.2)]"
            >
              <div className="sticky top-0 bg-white dark:bg-zinc-900 p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center z-10">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Settings2 className="w-8 h-8 text-sky-600" />
                  Override <span className="text-sky-600">Protocol</span>
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  <X className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Event Identifier</label>
                    <input 
                      type="text" 
                      value={editingEvent.name}
                      onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
                      className="w-full p-5 bg-zinc-50 dark:bg-white/5 border-2 border-zinc-100 dark:border-zinc-800 focus:border-black dark:focus:border-white outline-none font-black text-xl transition-all italic uppercase tracking-tighter"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Category Tag</label>
                    <select 
                      value={editingEvent.type}
                      onChange={(e) => setEditingEvent({...editingEvent, type: e.target.value})}
                      className="w-full p-5 bg-zinc-50 dark:bg-white/5 border-2 border-zinc-100 dark:border-zinc-800 focus:border-black dark:focus:border-white outline-none font-black uppercase tracking-widest text-xs appearance-none"
                    >
                      <option value="Conference">Conference</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Networking">Networking</option>
                      <option value="Webinar">Webinar</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Terminal / Venue</label>
                    <input 
                      type="text" 
                      value={editingEvent.venue || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, venue: e.target.value})}
                      className="w-full p-5 bg-zinc-50 dark:bg-white/5 border-2 border-zinc-100 dark:border-zinc-800 focus:border-black dark:focus:border-white outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Commencement</label>
                    <input 
                      type="date" 
                      value={editingEvent.event_date || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, event_date: e.target.value})}
                      className="w-full p-5 bg-zinc-50 dark:bg-white/5 border-2 border-zinc-100 dark:border-zinc-800 focus:border-black dark:focus:border-white outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Termination</label>
                    <input 
                      type="date" 
                      value={editingEvent.end_date || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, end_date: e.target.value})}
                      className="w-full p-5 bg-zinc-50 dark:bg-white/5 border-2 border-zinc-100 dark:border-zinc-800 focus:border-black dark:focus:border-white outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Registration Seal</label>
                    <input 
                      type="date" 
                      value={editingEvent.last_date_to_register || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, last_date_to_register: e.target.value})}
                      className="w-full p-5 bg-zinc-50 dark:bg-white/5 border-2 border-zinc-100 dark:border-zinc-800 focus:border-black dark:focus:border-white outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Capacity Load</label>
                    <input 
                      type="number" 
                      value={editingEvent.max_attendees || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, max_attendees: parseInt(e.target.value) || 0})}
                      className="w-full p-5 bg-zinc-50 dark:bg-white/5 border-2 border-zinc-100 dark:border-zinc-800 focus:border-black dark:focus:border-white outline-none font-bold"
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-4 pt-10">
                    <button 
                      type="submit"
                      disabled={updateLoading}
                      className="flex-1 bg-black dark:bg-white text-white dark:text-black py-6 font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-2xl active:scale-95 disabled:opacity-50"
                    >
                      {updateLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Sync Changes
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 py-6 font-black uppercase tracking-widest text-xs hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                    >
                      Abort
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
