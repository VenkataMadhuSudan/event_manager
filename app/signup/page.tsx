"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UserPlus, Loader2, ArrowLeft, Mail, Lock, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password })
      });

      if (res.ok) {
        toast.success("Account created successfully!");
        router.push('/my-events');
        router.refresh();
      } else {
        const json = await res.json();
        toast.error(json.message || "Failed to create account");
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white text-white dark:text-black mb-6">
              <UserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Create Account</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">Join the premium event community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Confirm Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none transition-all font-bold"
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-black dark:text-white font-black uppercase tracking-tighter hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
