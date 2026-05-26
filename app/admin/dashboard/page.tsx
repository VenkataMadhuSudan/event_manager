"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { 
  Search, 
  Trash2, 
  Download, 
  Plus, 
  Loader2, 
  Users, 
  Calendar, 
  TrendingUp, 
  UserCheck,
  Filter,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  event: string;
  participants: number;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      if (res.status === 401) {
        toast.error("Session expired. Please log in again.", { id: "session-expired" });
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setStudents(json.students);
      } else {
        toast.error("Failed to load students");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Student deleted");
        setStudents(s => s.filter(stu => stu.id !== id));
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(filteredStudents.map(s => ({
      ID: s.id,
      Name: s.name,
      Email: s.email,
      Phone: s.phone,
      Event: s.event,
      Participants: s.participants,
      "Registration Date": new Date(s.created_at).toLocaleString(),
    })));
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `registrations_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.email.toLowerCase().includes(search.toLowerCase()) || 
                            s.phone.includes(search);
      const matchesEvent = filterEvent ? s.event === filterEvent : true;
      return matchesSearch && matchesEvent;
    });
  }, [students, search, filterEvent]);

  const uniqueEvents = useMemo(() => Array.from(new Set(students.map(s => s.event))), [students]);

  // Analytics Stats
  const stats = useMemo(() => {
    const totalRegistrations = students.length;
    const totalParticipants = students.reduce((acc, curr) => acc + (Number(curr.participants) || 0), 0);
    const activeEvents = uniqueEvents.length;
    
    return [
      { label: "Total Registrations", value: totalRegistrations, icon: Users, color: "bg-blue-500" },
      { label: "Total Participants", value: totalParticipants, icon: UserCheck, color: "bg-sky-500" },
      { label: "Active Events", value: activeEvents, icon: Calendar, color: "bg-emerald-500" },
      { label: "Growth Rate", value: "+12.5%", icon: TrendingUp, color: "bg-orange-500" },
    ];
  }, [students, uniqueEvents]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-5xl font-black text-black dark:text-white tracking-tighter uppercase">Admin Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Global Platform Overview & Management
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <button 
            onClick={fetchStudents}
            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-6 py-4 rounded-none hover:bg-zinc-50 dark:hover:bg-zinc-800 font-black transition-all shadow-lg uppercase tracking-widest text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Master List</span>
          </button>
          <Link 
            href="/register"
            target="_blank"
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-none hover:opacity-90 font-black transition-all shadow-xl uppercase tracking-widest text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </Link>
        </motion.div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-16" />
            </div>
          ))
        ) : (
          stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden group"
            >
              <div className="absolute right-[-10px] top-[-10px] opacity-[0.05] group-hover:opacity-10 transition-opacity">
                <stat.icon className="w-24 h-24 rotate-12" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-black dark:text-white tracking-tighter">{stat.value}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Main Table Section */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Filter by name, email or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select 
                value={filterEvent} 
                onChange={(e) => setFilterEvent(e.target.value)}
                className="bg-transparent focus:outline-none font-black uppercase tracking-widest text-xs"
              >
                <option value="">All Events</option>
                {uniqueEvents.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-8 py-4">Participant</th>
                <th className="px-8 py-4">Event Context</th>
                <th className="px-8 py-4 text-center">Size</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Timeline</th>
                <th className="px-8 py-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-8 py-6">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <p className="font-black uppercase tracking-widest text-xs text-zinc-400 italic">No matching records detected in system.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, i) => (
                    <motion.tr 
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-black dark:text-white text-base">{student.name}</span>
                          <span className="text-zinc-500 font-medium text-xs tracking-tight">{student.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 w-fit">
                            {student.event}
                          </span>
                          <span className="text-[10px] text-zinc-400 mt-1 font-mono uppercase">{student.phone}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-black dark:text-white">{student.participants}</td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 ${
                          student.status === 'CANCELLED' 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {student.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-zinc-500 font-bold text-xs uppercase tracking-tighter">
                        {new Date(student.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="text-red-500 hover:text-white p-3 hover:bg-red-500 transition-all shadow-sm"
                          title="Purge Registration"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const ShieldAlert = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m12 8 0 4" />
    <path d="m12 16 0.01 0" />
  </svg>
);
