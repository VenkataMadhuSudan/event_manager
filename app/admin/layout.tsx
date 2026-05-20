"use client";

import { LayoutDashboard, LogOut, QrCode, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Failed to log out');
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Events", href: "/admin/events", icon: Calendar },
    { label: "QR Scanner", href: "/admin/scanner", icon: QrCode },
    {
      label: "Settings", href: "/admin/settings", icon: (props: any) => (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
      )
    },
  ];


  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white/80 backdrop-blur-xl border-r-4 border-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b-4 border-indigo-50 flex items-center justify-between">
          <span className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">
            Admin <span className="text-sky-600">Core</span>
          </span>
        </div>

        <nav className="flex-1 p-6 space-y-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-6 py-4 rounded-none transition-all duration-300 relative group overflow-hidden ${isActive
                    ? "bg-sky-600 text-white font-black shadow-lg shadow-sky-200 -translate-y-1"
                    : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-900 font-bold"
                  }`}
              >
                <item.icon className={`w-6 h-6 z-10 ${isActive ? "text-white" : "text-gray-400 group-hover:text-sky-600"}`} />
                <span className="z-10 uppercase tracking-widest text-xs">{item.label}</span>
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-sky-600 opacity-100" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t-4 border-indigo-50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 w-full text-left rounded-none text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs group"
          >
            <LogOut className="w-6 h-6 text-red-400 group-hover:text-white" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
