import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Plus, Calendar, Globe } from 'lucide-react';
import { useState, Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

type ViewMode = 'selection' | 'host' | 'register';

export interface Event {
  id: string;
  name: string;
  slug: string;
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
}

interface HostEventViewProps {
  user: { name: string; email: string } | null;
  setView: Dispatch<SetStateAction<ViewMode>>;
  origin: string;
  events: Event[];
  setEvents: Dispatch<SetStateAction<Event[]>>;
  loadingEvents: boolean;
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  createdEvent: Event | null;
  setCreatedEvent: Dispatch<SetStateAction<Event | null>>;
}

export default function HostEventView({
  user,
  setView,
  origin,
  events,
  setEvents,
  loadingEvents,
  currentStep,
  setCurrentStep,
  createdEvent,
  setCreatedEvent,
}: HostEventViewProps) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastDateToRegister, setLastDateToRegister] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDuration, setEventDuration] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [eventMode, setEventMode] = useState('OFFLINE');
  const [isPaid, setIsPaid] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState('');
  const [teamSize, setTeamSize] = useState('1');
  const [bannerUrl, setBannerUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) return;
    if (!eventName.trim()) return;

    if (!user) {
      toast.error('You must be signed in to create an event');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          event_date: eventDate,
          end_date: endDate,
          last_date_to_register: lastDateToRegister,
          type: eventType,
          duration: eventDuration,
          venue: eventVenue,
          details: eventDetails,
          mode: eventMode,
          is_paid: isPaid,
          max_attendees: maxAttendees ? parseInt(maxAttendees) : undefined,
          team_size: parseInt(teamSize),
          banner_url: bannerUrl,
          poster_url: posterUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedEvent(data.event);
        setEvents((prev) => [data.event, ...prev]);
        toast.success('Event Created Successfully!');
        
        // Reset fields
        setEventName('');
        setEventDate('');
        setEndDate('');
        setLastDateToRegister('');
        setEventType('');
        setEventDuration('');
        setEventVenue('');
        setEventDetails('');
        setEventMode('OFFLINE');
        setIsPaid(false);
        setMaxAttendees('');
        setTeamSize('1');
        setBannerUrl('');
        setPosterUrl('');
        setCurrentStep(1);
      } else {
        toast.error(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const copyToClipboard = (slug: string) => {
    const url = `${origin}/event/${slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopied(true);
          toast.success('Link Copied!');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => toast.error('Failed to copy'));
    } else {
      toast.error('Clipboard not supported');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-4 mb-12">
        <button
          onClick={() => { setView('selection'); setCurrentStep(1); setCreatedEvent(null); }}
          className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Event <span className="text-sky-500 italic">Hosting</span></h2>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step <= currentStep ? 'bg-sky-500' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 md:p-12 bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl space-y-10 text-left overflow-hidden relative">
        {createdEvent ? (
          <div className="space-y-10 animate-in zoom-in-95 duration-500 py-10">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-4">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">Event <span className="text-black">Live!</span></h2>
              <p className="text-gray-400 font-medium max-w-sm">Your event is ready for the world. Share the registration link below.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-black">Public Registration Link</span>
                <Link href={`/event/${createdEvent.slug}`} target="_blank" className="text-white hover:text-blue-400 transition-colors flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest">
                  Preview Page <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={origin ? `${origin}/event/${createdEvent.slug}` : `/event/${createdEvent.slug}`}
                  className="flex-1 p-5 bg-black/40 border border-white/10 text-xs font-mono text-black outline-none"
                />
                <button
                  onClick={() => copyToClipboard(createdEvent.slug)}
                  className="px-8 bg-white text-black hover:bg-blue-500 hover:text-white transition-all font-black"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <button
                onClick={() => { setCreatedEvent(null); setCurrentStep(1); }}
                className="w-full py-5 border-2 border-dashed border-black/20 text-black font-black uppercase tracking-widest text-xs hover:border-black/40 hover:bg-black/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Host Another Event
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-sky-500">Step {currentStep} of 4</span>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                {currentStep === 1 && "Basic Info"}
                {currentStep === 2 && "Date & Venue"}
                {currentStep === 3 && "Tickets & Capacity"}
                {currentStep === 4 && "Media & Branding"}
              </h1>
            </div>

            <form
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentStep < 4) {
                  e.preventDefault();
                  nextStep();
                }
              }}
              className="relative min-h-[400px]"
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Event Title</label>
                    <input
                      type="text"
                      placeholder="Ex: Tech Conference 2026"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      required
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold text-lg transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Event Category</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all text-black"
                    >
                      <option value="">Select Category</option>
                      <option value="Conference">Conference</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Networking">Networking</option>
                      <option value="Webinar">Webinar</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Description</label>
                    <textarea
                      placeholder="Describe your event..."
                      value={eventDetails}
                      onChange={(e) => setEventDetails(e.target.value)}
                      rows={6}
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all resize-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Step 2: Date & Venue */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black">Start Date</label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all text-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all text-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black">Registration Deadline</label>
                      <input
                        type="date"
                        value={lastDateToRegister}
                        onChange={(e) => setLastDateToRegister(e.target.value)}
                        required
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all text-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Duration</label>
                      <input
                        type="text"
                        placeholder="Ex: 3 Hours, 2 Days"
                        value={eventDuration}
                        onChange={(e) => setEventDuration(e.target.value)}
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mode</label>
                      <div className="flex gap-4">
                        {['OFFLINE', 'ONLINE'].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setEventMode(mode)}
                            className={`flex-1 py-4 font-black text-xs uppercase tracking-widest transition-all ${eventMode === mode ? 'bg-sky-600 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Venue / Platform</label>
                      <input
                        type="text"
                        placeholder={eventMode === 'OFFLINE' ? "Physical Location" : "Zoom/Meet Link"}
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Tickets & Capacity */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ticket Type</label>
                    <div className="flex gap-4">
                      {[false, true].map(paid => (
                        <button
                          key={paid ? 'paid' : 'free'}
                          type="button"
                          onClick={() => setIsPaid(paid)}
                          className={`flex-1 py-4 font-black text-xs uppercase tracking-widest transition-all ${isPaid === paid ? 'bg-sky-600 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                        >
                          {paid ? 'Paid' : 'Free'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Max Attendees</label>
                      <input
                        type="number"
                        placeholder="Unlimited if empty"
                        value={maxAttendees}
                        onChange={(e) => setMaxAttendees(e.target.value)}
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Max Team Size</label>
                      <input
                        type="number"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        min="1"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Media & Branding */}
              {currentStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Banner URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Poster URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={posterUrl}
                      onChange={(e) => setPosterUrl(e.target.value)}
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 focus:border-sky-500 outline-none font-bold transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-12 mt-auto">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-6 bg-white/5 border border-white/10 text-gray-400 font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all active:scale-[0.98]"
                  >
                    Previous
                  </button>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={currentStep === 1 && !eventName.trim()}
                    className="flex-1 py-6 bg-sky-600 text-white font-black uppercase tracking-widest text-sm hover:bg-sky-500 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateEvent}
                    disabled={loading}
                    className="flex-1 py-6 bg-white text-black font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {loading ? 'Processing...' : 'Complete Event'}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>

      {/* Your Events */}
      <div className="mt-24 space-y-12">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">Manage <span className="text-sky-500">Events</span></h2>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{events.length} Active</span>
        </div>

        {loadingEvents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-8 bg-white/[0.02] border border-white/10 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {events.map((event, idx) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group p-8 bg-white/[0.02] border border-white/10 hover:border-sky-500/50 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/event/${event.slug}`} target="_blank" className="p-2 bg-white/10 hover:bg-white text-white hover:text-black transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 group-hover:text-sky-400 transition-colors">{event.name}</h3>

                  <div className="space-y-1.5 text-[10px] font-bold text-black uppercase tracking-widest mb-6">
                    {event.event_date && <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {new Date(event.event_date).toLocaleDateString()}</div>}
                    {event.venue && <div className="flex items-center gap-2"><Globe className="w-3 h-3" /> {event.venue}</div>}
                    {event.duration && <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {event.duration}</div>}
                  </div>

                  <button
                    onClick={() => copyToClipboard(event.slug)}
                    className="w-full py-4 border border-white/10 hover:bg-white hover:text-black transition-all font-black uppercase tracking-widest text-[10px]"
                  >
                    Copy Registration Link
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
