"use client";

import Link from 'next/link';
import { Calendar, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IntroScreen from '@/components/IntroScreen';
import HeroView from '@/components/home/HeroView';
import HostEventView, { Event } from '@/components/home/HostEventView';
import ExploreEventsView from '@/components/home/ExploreEventsView';

type ViewMode = 'selection' | 'host' | 'register';

export default function Home() {
  const router = useRouter();
  
  // Shared state
  const [view, setView] = useState<ViewMode>('selection');
  const [origin, setOrigin] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Auth state
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);

  // Host flow state
  const [currentStep, setCurrentStep] = useState(1);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  // Handle hydration mismatch by setting origin after mount
  useEffect(() => {
    setOrigin(window.location.origin);
    fetchEvents();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      }
    } catch (err) { }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const resetHostFlow = () => {
    setCurrentStep(1);
    setCreatedEvent(null);
  };

  return (
    <>
      {showIntro && (
        <IntroScreen onComplete={() => setShowIntro(false)} />
      )}
      <div className="flex flex-col min-h-screen font-sans overflow-x-hidden">
        {/* Navbar */}
        <header className="px-6 lg:px-12 h-16 flex items-center border-b glass-morphism sticky top-0 z-50">
          <button onClick={() => setView('selection')} className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-sky-500/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              EventHub
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex ml-auto gap-8 items-center">
            <button onClick={() => setView('selection')} className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-sky-500 transition-colors">Home</button>
            <button onClick={() => setView('register')} className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-sky-500 transition-colors">Events</button>

            {user ? (
              <Link
                href="/my-events"
                className="text-sm font-bold uppercase tracking-widest text-blue-600 hover:text-sky-500 transition-colors"
              >
                My Events
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-sky-500 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}

            <Link
              href="/admin/login"
              className="ml-4 text-xs font-black uppercase tracking-[0.2em] border-2 border-gray-300 px-6 py-2.5 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300"
            >
              Admin Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden ml-auto p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden pt-20 px-6 animate-in fade-in slide-in-from-top-4">
            <nav className="flex flex-col gap-6 text-center">
              <button onClick={() => { setView('selection'); setIsMenuOpen(false); }} className="text-2xl font-black uppercase tracking-widest py-2 border-b border-gray-200 text-gray-900">Home</button>
              <button onClick={() => { setView('register'); setIsMenuOpen(false); }} className="text-2xl font-black uppercase tracking-widest py-2 border-b border-gray-200 text-gray-900">Events</button>
              {user ? (
                <Link href="/my-events" className="text-2xl font-black uppercase tracking-widest py-2 border-b border-gray-200 text-blue-600">My Events</Link>
              ) : (
                <Link href="/login" className="text-2xl font-black uppercase tracking-widest py-2 border-b border-gray-200 text-gray-900">Sign In</Link>
              )}
              <Link href="/admin/login" className="mt-4 bg-gray-900 text-white py-4 font-black uppercase tracking-widest">Admin Login</Link>
            </nav>
          </div>
        )}

        <main className="flex-1 flex flex-col items-center justify-start">
          {view === 'selection' && (
            <HeroView user={user} setView={setView} resetHostFlow={resetHostFlow} />
          )}

          {view === 'host' && (
            <HostEventView 
              user={user} 
              setView={setView}
              origin={origin}
              events={events}
              setEvents={setEvents}
              loadingEvents={loadingEvents}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              createdEvent={createdEvent}
              setCreatedEvent={setCreatedEvent}
            />
          )}

          {view === 'register' && (
            <ExploreEventsView 
              setView={setView}
              events={events}
              loadingEvents={loadingEvents}
            />
          )}
        </main>
      </div>
    </>
  );
}
