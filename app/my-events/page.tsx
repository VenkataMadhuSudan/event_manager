"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Settings, MapPin, Loader2, LogOut, ArrowLeft, Plus, CheckCircle2, ChevronRight, ExternalLink, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyEventsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'hosted' | 'registered'>('hosted');
  const [user, setUser] = useState<any>(null);
  const [hostedEvents, setHostedEvents] = useState<any[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/user/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      // Fetch hosted and registered events
      const eventsRes = await fetch('/api/user/events');
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setHostedEvents(eventsData.hosted || []);
        setRegisteredEvents(eventsData.registered || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/user/logout', { method: 'POST' });
    toast.success("Logged out");
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/70 backdrop-blur-xl border-b px-8 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="p-3 bg-gray-900 text-white hover:bg-sky-600 transition-all shadow-lg group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">Dashboard</h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest hidden sm:block">Hello, {user?.name}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 px-4 py-2 border-2 border-transparent hover:border-red-100 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        <div className="flex gap-8 border-b-4 border-gray-100 mb-12">
          <button
            onClick={() => setActiveTab('hosted')}
            className={`text-xl font-black uppercase tracking-tighter italic px-4 py-4 transition-all relative ${activeTab === 'hosted' ? 'text-sky-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Hosted ({hostedEvents.length})
            {activeTab === 'hosted' && <motion.div layoutId="tab" className="absolute bottom-[-4px] left-0 right-0 h-1 bg-sky-600" />}
          </button>
          <button
            onClick={() => setActiveTab('registered')}
            className={`text-xl font-black uppercase tracking-tighter italic px-4 py-4 transition-all relative ${activeTab === 'registered' ? 'text-sky-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Registered ({registeredEvents.length})
            {activeTab === 'registered' && <motion.div layoutId="tab" className="absolute bottom-[-4px] left-0 right-0 h-1 bg-sky-600" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-8 border-l-[12px] border-gray-100 shadow-xl space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-12" />
                </div>
              </div>
            ))
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'hosted' ? (
                <motion.div 
                  key="hosted"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {hostedEvents.length > 0 ? hostedEvents.map((event, idx) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group bg-white border-l-[12px] border-sky-600 shadow-xl hover:shadow-sky-500/10 transition-all duration-500 overflow-hidden flex flex-col"
                    >
                      <div className="h-32 bg-gray-900 flex items-center justify-center relative overflow-hidden">
                        {event.banner_url ? (
                          <img src={event.banner_url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" alt="" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-sky-950 opacity-80" />
                        )}
                        <span className="relative z-10 text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">{event.type || 'Official Event'}</span>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-black mb-4 truncate uppercase tracking-tighter italic group-hover:text-sky-600 transition-colors">{event.name}</h3>
                        <div className="space-y-2 mb-8 flex-1">
                          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                            {new Date(event.event_date || event.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <MapPin className="w-3.5 h-3.5 text-sky-500" />
                            <span className="truncate">{event.venue || 'TBA'}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Link href={`/my-events/${event.slug}/manage`} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 font-black uppercase tracking-widest text-[10px] hover:bg-sky-600 transition-all shadow-lg active:scale-95">
                            <Settings className="w-4 h-4" />
                            Manage
                          </Link>
                          <Link href={`/register?eventId=${event.id}`} target="_blank" className="p-4 flex items-center justify-center border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all shadow-md active:scale-95">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full py-32 text-center bg-white/50 border-4 border-dashed border-gray-100">
                      <div className="flex flex-col items-center opacity-30">
                        <Plus className="w-12 h-12 mb-4" />
                        <p className="text-sm font-black uppercase tracking-[0.3em] mb-4">No events hosted yet</p>
                        <Link href="/?host=true" className="px-8 py-4 bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-sky-600 transition-all">Host your first event</Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="registered"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {registeredEvents.length > 0 ? registeredEvents.map((reg, idx) => (
                    <motion.div 
                      key={reg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group bg-white border-l-[12px] border-blue-500 shadow-xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col"
                    >
                      <div className="p-8 flex-1 flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest">
                            {reg.status}
                          </span>
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter italic leading-tight group-hover:text-green-600 transition-colors">{reg.eventRel?.name || reg.event}</h3>
                        <div className="space-y-4 mb-8 bg-gray-50 p-4 border-l-4 border-gray-200">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Registered As</span>
                            <span className="text-xs font-bold text-gray-700">{reg.name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Team Size</span>
                            <span className="text-xs font-bold text-gray-700">{reg.participants} Participants</span>
                          </div>
                        </div>
                        <Link href={`/event/${reg.eventRel?.slug || ''}`} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-gray-900 text-gray-900 font-black uppercase tracking-widest text-[10px] hover:bg-gray-900 hover:text-white transition-all active:scale-95">
                          View Event Detail
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full py-32 text-center bg-white/50 border-4 border-dashed border-gray-100">
                      <div className="flex flex-col items-center opacity-30">
                        <Users className="w-12 h-12 mb-4" />
                        <p className="text-sm font-black uppercase tracking-[0.3em]">You haven't registered for any events</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
