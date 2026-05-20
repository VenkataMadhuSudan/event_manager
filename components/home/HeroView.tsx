import { Calendar, QrCode, ShieldCheck, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction } from 'react';

type ViewMode = 'selection' | 'host' | 'register';

interface HeroViewProps {
  user: { name: string; email: string } | null;
  setView: Dispatch<SetStateAction<ViewMode>>;
  resetHostFlow: () => void;
}

export default function HeroView({ user, setView, resetHostFlow }: HeroViewProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center text-center">
      {/* Hero Section */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 border border-sky-200 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600">The Future of Events</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-5xl mx-auto italic uppercase text-gray-900">
          Plan Amazing <span className="text-transparent bg-clip-text bg-gradient-to-b from-sky-500 to-blue-600">Events</span> Effortlessly
        </h1>

        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Create, manage, and join unforgettable events in minutes. The ultimate platform for organizers and attendees.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <button
            onClick={() => {
              if (!user) {
                toast.error('Please sign in to create an event');
                router.push('/login');
                return;
              }
              resetHostFlow();
              setView('host');
            }}
            className="group px-10 py-5 bg-gray-900 text-white font-black uppercase tracking-widest text-sm hover:bg-sky-600 transition-all duration-300 shadow-xl active:scale-95 flex items-center gap-2"
          >
            Create Event <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('register')}
            className="group px-10 py-5 bg-transparent border-2 border-gray-900 text-gray-900 font-black uppercase tracking-widest text-sm hover:bg-gray-900 hover:text-white transition-all duration-300 active:scale-95"
          >
            Explore Events
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        <div className="p-10 glass-morphism border border-sky-200 group hover:border-sky-500 transition-all duration-500 text-left">
          <Calendar className="h-10 w-10 text-sky-500 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="font-black text-2xl mb-4 uppercase tracking-tighter text-gray-900">Easy Creation</h3>
          <p className="text-gray-600 font-medium">Setup your event page in seconds with our intuitive interface.</p>
        </div>
        <div className="p-10 glass-morphism border border-blue-200 group hover:border-blue-500 transition-all duration-500 text-left">
          <QrCode className="h-10 w-10 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="font-black text-2xl mb-4 uppercase tracking-tighter text-gray-900">Smart QR Tickets</h3>
          <p className="text-gray-600 font-medium">Automatic ticket generation and secure digital check-ins.</p>
        </div>
        <div className="p-10 glass-morphism border border-cyan-200 group hover:border-cyan-500 transition-all duration-500 text-left">
          <ShieldCheck className="h-10 w-10 text-cyan-500 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="font-black text-2xl mb-4 uppercase tracking-tighter text-gray-900">Real-time Stats</h3>
          <p className="text-gray-600 font-medium">Track registrations and attendance with live dashboards.</p>
        </div>
      </div>
    </div>
  );
}
