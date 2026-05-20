import { ArrowLeft, Link2, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Event } from './HostEventView';

type ViewMode = 'selection' | 'host' | 'register';

interface ExploreEventsViewProps {
  setView: Dispatch<SetStateAction<ViewMode>>;
  events: Event[];
  loadingEvents: boolean;
}

export default function ExploreEventsView({ setView, events, loadingEvents }: ExploreEventsViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [directLink, setDirectLink] = useState('');

  const handleDirectLinkGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directLink.trim()) return;

    let slug = directLink.trim();

    try {
      if (slug.includes('/event/')) {
        const parts = slug.split('/event/');
        slug = parts[parts.length - 1].split('?')[0];
      } else if (slug.startsWith('http')) {
        const url = new URL(slug);
        const pathParts = url.pathname.split('/');
        slug = pathParts[pathParts.length - 1];
      }
    } catch (err) { }

    if (slug) {
      router.push(`/event/${slug}`);
    } else {
      toast.error('Invalid registration link or slug');
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.type && event.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (event.venue && event.venue.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 animate-in slide-in-from-left-8 duration-500">
      <div className="flex items-center gap-4 mb-12">
        <button
          onClick={() => setView('selection')}
          className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Explore <span className="text-sky-500 italic">Portal</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black uppercase tracking-tighter leading-none italic">Discover <br />Events</h1>
            <p className="text-gray-400 font-medium">Join the community and find the next big thing.</p>
          </div>

          <div className="p-10 bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-2 text-sky-400">
              <Link2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Join with Link</span>
            </div>
            <form onSubmit={handleDirectLinkGo} className="space-y-4">
              <input
                type="text"
                placeholder="Paste event link or slug..."
                value={directLink}
                onChange={(e) => setDirectLink(e.target.value)}
                className="w-full px-6 py-5 bg-black/50 border border-white/10 focus:border-sky-500 outline-none font-mono text-sm transition-all"
              />
              <button className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-sky-600 hover:text-white transition-all">Go to registration</button>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="text"
              placeholder="Search Events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-6 bg-white/[0.03] border-4 border-white/10 focus:border-sky-500 outline-none font-black text-xl uppercase tracking-tighter placeholder:text-white/10 transition-all"
            />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            {loadingEvents ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-white/[0.02] border border-white/5 space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <div className="flex gap-4">
                      <Skeleton className="h-2 w-20" />
                      <Skeleton className="h-2 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <AnimatePresence>
                {filteredEvents.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={`/event/${event.slug}`}
                      className="block p-6 bg-white/[0.02] border border-white/5 hover:border-sky-500/50 hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-tighter group-hover:text-sky-400 transition-colors">{event.name}</h3>
                          <div className="flex gap-4 mt-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <span>{event.type}</span>
                            <span>{event.venue}</span>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:rotate-90 transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="py-20 text-center text-gray-600 font-black uppercase tracking-widest text-xs border border-dashed border-white/5">No events found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
