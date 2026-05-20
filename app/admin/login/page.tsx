"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock, Loader2, ArrowLeft, ShieldAlert, LogIn, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success("Login successful!");
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        const json = await res.json();
        toast.error(json.message || "Invalid credentials");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Home</span>
        </Link>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 border-4 border-black dark:border-white shadow-[20px_20px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,0.05)]">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-600 text-white mb-6 transform rotate-3 shadow-xl">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Admin <span className="text-sky-600">Access</span></h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">Secure control panel authentication</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Administrator ID</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter Admin ID"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 focus:border-sky-600 outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 focus:border-sky-600 outline-none transition-all font-bold"
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-sky-600 text-white py-4 font-black uppercase tracking-widest text-sm hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Authorize Access</span>
                  <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
