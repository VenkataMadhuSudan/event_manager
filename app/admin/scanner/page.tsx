"use client";

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, RefreshCcw, QrCode, ShieldCheck, User, Calendar, Users, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type ValidationStatus = {
  status: 'VALID' | 'INVALID' | 'ALREADY_CHECKED_IN';
  student?: {
    name: string;
    event: string;
    participants: number;
  };
  message?: string;
};

export default function ScannerPage() {
  const [result, setResult] = useState<ValidationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);

  const handleScan = async (text: { rawValue: string }[]) => {
    if (loading || paused || !text.length) return;

    setLoading(true);
    setPaused(true);

    try {
      const scannedText = text[0].rawValue;
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scannedText })
      });

      const data = await res.json();
      setResult(data);

      if (data.status === 'VALID') {
        toast.success('Ticket Validated');
      } else if (data.status === 'ALREADY_CHECKED_IN') {
        toast.error('Already Checked In', { icon: '⚠️' });
      } else {
        toast.error('Invalid Ticket');
      }
    } catch (error) {
      console.error('Scan Error:', error);
      toast.error('Verification failed.');
      setResult({ status: 'INVALID', message: 'Network error checking ticket.' });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setPaused(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
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
          <h1 className="text-5xl font-black text-black dark:text-white tracking-tighter uppercase italic">
            Entry <span className="text-sky-600">Scanner</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium flex items-center gap-2 uppercase text-xs tracking-widest">
            <ShieldCheck className="w-4 h-4" /> Secure Validation Terminal
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Scanner Viewport */}
        <div className="lg:col-span-7 bg-black dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[15px_15px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden aspect-video md:aspect-square lg:aspect-auto lg:min-h-[600px]">
          <AnimatePresence mode="wait">
            {!paused ? (
              <motion.div 
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full relative"
              >
                <Scanner
                  onScan={handleScan}
                  onError={(error: unknown) => console.error(error)}
                  components={{ finder: true }}
                  constraints={{ facingMode: 'environment' }}
                  sound={false}
                />
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40"></div>
                <div className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 text-white">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Feed</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center h-full p-12 text-center bg-white dark:bg-zinc-900"
              >
                {result?.status === 'VALID' ? (
                  <div className="space-y-8 w-full max-w-sm">
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="mx-auto w-24 h-24 bg-emerald-500 text-white flex items-center justify-center shadow-2xl transform -rotate-6"
                    >
                      <CheckCircle className="w-12 h-12" />
                    </motion.div>
                    <h3 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter italic">Access <span className="text-emerald-500">Granted</span></h3>
                    
                    <div className="bg-zinc-50 dark:bg-white/5 p-8 border-2 border-emerald-100 dark:border-emerald-900/30 text-left space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Attendee</p>
                        <p className="text-xl font-black text-black dark:text-white flex items-center gap-2"><User className="w-5 h-5 text-emerald-500" /> {result.student?.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Event Access</p>
                        <p className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase flex items-center gap-2"><Calendar className="w-4 h-4" /> {result.student?.event}</p>
                      </div>
                      <div className="pt-4 border-t border-emerald-100 dark:border-emerald-900/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Participants</p>
                        <p className="text-xl font-black text-black dark:text-white flex items-center gap-2"><Users className="w-5 h-5" /> {result.student?.participants} Pax</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 w-full max-w-sm">
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className={`mx-auto w-24 h-24 flex items-center justify-center shadow-2xl transform rotate-6 ${result?.status === 'ALREADY_CHECKED_IN' ? 'bg-orange-500' : 'bg-red-500'} text-white`}
                    >
                      {result?.status === 'ALREADY_CHECKED_IN' ? <RefreshCcw className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                    </motion.div>
                    <h3 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter italic">
                      {result?.status === 'ALREADY_CHECKED_IN' ? <>Already <span className="text-orange-500">In</span></> : <>Access <span className="text-red-500">Denied</span></>}
                    </h3>
                    <p className="text-zinc-500 font-bold bg-zinc-100 dark:bg-white/5 p-6 border-2 border-zinc-200 dark:border-zinc-800">
                      {result?.message || (result?.status === 'ALREADY_CHECKED_IN' ? 'This ticket was already scanned and used for entry.' : 'This QR code is invalid or not recognized by the system.')}
                    </p>
                  </div>
                )}

                <button
                  onClick={resetScanner}
                  className="mt-12 flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-10 py-5 hover:opacity-90 font-black transition-all shadow-xl uppercase tracking-widest text-xs group active:scale-95"
                >
                  <QrCode className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  Continue Scanning
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions Panel */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 p-10 shadow-lg">
            <h3 className="font-black text-2xl mb-10 text-black dark:text-white uppercase tracking-tighter italic border-b-4 border-sky-600 pb-2 inline-block">Scanner Protocol</h3>
            <div className="space-y-8">
              {[
                { step: 1, text: "Position the ticket QR code within the highlighted frame.", icon: QrCode },
                { step: 2, text: "Maintain steady focus until the terminal captures the data.", icon: ShieldCheck },
                { step: 3, text: "The system will auto-verify against the master records.", icon: User },
                { step: 4, text: "Reset the terminal after each successful validation.", icon: RefreshCcw }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-black dark:text-white group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Phase 0{item.step}</p>
                    <p className="text-zinc-600 dark:text-zinc-400 font-bold leading-tight">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-sky-600 text-white flex items-center justify-between shadow-xl overflow-hidden relative group">
            <div className="relative z-10">
              <h4 className="text-xl font-black uppercase tracking-tighter">Emergency Sync</h4>
              <p className="text-sky-100 text-xs font-bold mt-1">Force refresh if scanner lags.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white text-sky-600 p-4 font-black uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-all z-10"
            >
              Reload System
            </button>
            <QrCode className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
          </div>
        </div>
      </div>
    </div>
  );
}
