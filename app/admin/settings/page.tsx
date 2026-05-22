"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCog, Trash2, Key, User, Mail, Server, Send, Loader2, CheckCircle2, XCircle, Shield, Hash } from "lucide-react";
import toast from "react-hot-toast";

interface Admin {
  id: string;
  username: string;
}

interface SmtpSettings {
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
}

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });
  const [updateAdmin, setUpdateAdmin] = useState<{ id: string; username: string; password?: string } | null>(null);

  // SMTP State
  const [smtp, setSmtp] = useState<SmtpSettings>({
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "465",
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_FROM: "manager.eventhub@gmail.com",
  });
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (res.ok) setAdmins(data);
    } catch {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchSmtpSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/email");
      const data = await res.json();
      if (data.success && data.settings) {
        setSmtp((prev) => ({
          ...prev,
          ...data.settings,
        }));
      }
    } catch {
      // Settings not configured yet, use defaults
    } finally {
      setSmtpLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchSmtpSettings();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify(newAdmin),
      });
      if (res.ok) {
        toast.success("Admin added successfully");
        setNewAdmin({ username: "", password: "" });
        fetchAdmins();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add admin");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateAdmin) return;
    try {
      const res = await fetch(`/api/admin/admins/${updateAdmin.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          username: updateAdmin.username,
          password: updateAdmin.password,
        }),
      });
      if (res.ok) {
        toast.success("Admin updated successfully");
        setUpdateAdmin(null);
        fetchAdmins();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update admin");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Admin deleted successfully");
        fetchAdmins();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete admin");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    try {
      const res = await fetch("/api/admin/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtp),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("SMTP settings saved successfully");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("An error occurred saving settings");
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Enter a test email address");
      return;
    }
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
        toast.success("Test email sent!");
      } else {
        setTestResult({ success: false, message: data.error || "Failed to send test email" });
        toast.error(data.error || "Test email failed");
      }
    } catch {
      setTestResult({ success: false, message: "Network error" });
      toast.error("Network error sending test email");
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-indigo-50/10 min-h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
          Admin <span className="text-sky-600">Settings</span>
        </h1>
        <p className="text-gray-500 font-medium lowercase tracking-tight">
          Manage your administrative team, credentials, and email configuration.
        </p>
      </div>

      {/* ═══════════ SMTP SETTINGS SECTION ═══════════ */}
      <div className="bg-white border-4 border-white shadow-2xl p-8 space-y-6">
        <div className="flex items-center gap-4 border-b-4 border-indigo-50 pb-6">
          <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">Email & SMTP Configuration</h2>
            <p className="text-xs text-gray-400 font-bold mt-1">Configure your mail server to send registration confirmation emails instantly.</p>
          </div>
        </div>

        {smtpLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          </div>
        ) : (
          <form onSubmit={handleSaveSmtp} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SMTP Host */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5" /> SMTP Host
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold text-sm"
                  placeholder="smtp.gmail.com"
                  value={smtp.SMTP_HOST}
                  onChange={(e) => setSmtp({ ...smtp, SMTP_HOST: e.target.value })}
                />
              </div>

              {/* SMTP Port */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" /> SMTP Port
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold text-sm"
                  placeholder="465"
                  value={smtp.SMTP_PORT}
                  onChange={(e) => setSmtp({ ...smtp, SMTP_PORT: e.target.value })}
                />
              </div>

              {/* SMTP User */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> SMTP Username / Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold text-sm"
                  placeholder="manager.eventhub@gmail.com"
                  value={smtp.SMTP_USER}
                  onChange={(e) => setSmtp({ ...smtp, SMTP_USER: e.target.value })}
                />
              </div>

              {/* SMTP Password */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> SMTP Password / App Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold text-sm"
                  placeholder="••••••••••••••••"
                  value={smtp.SMTP_PASS}
                  onChange={(e) => setSmtp({ ...smtp, SMTP_PASS: e.target.value })}
                />
              </div>

              {/* From Email */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> From Email Address (Sender)
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold text-sm"
                  placeholder="manager.eventhub@gmail.com"
                  value={smtp.SMTP_FROM}
                  onChange={(e) => setSmtp({ ...smtp, SMTP_FROM: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={smtpSaving}
              className="w-full bg-sky-600 text-white py-4 font-black uppercase tracking-widest hover:bg-sky-700 transition-colors shadow-lg shadow-sky-100 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {smtpSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {smtpSaving ? "Saving..." : "Save SMTP Settings"}
            </button>
          </form>
        )}

        {/* Test Email Section */}
        <div className="border-t-4 border-indigo-50 pt-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-500" /> Test Email Connection
          </h3>
          <p className="text-xs text-gray-400 font-medium">
            Send a test confirmation email to verify your SMTP settings are working correctly.
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold text-sm"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testSending}
              className="px-8 bg-gray-900 text-white font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-60"
            >
              {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {testSending ? "Sending..." : "Send Test"}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center gap-3 p-4 ${testResult.success ? "bg-emerald-50 border-l-4 border-emerald-500" : "bg-red-50 border-l-4 border-red-500"}`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm font-bold ${testResult.success ? "text-emerald-700" : "text-red-700"}`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ ADMIN MANAGEMENT SECTION ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Admin Card */}
        <div className="bg-white border-4 border-white shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-4 border-b-4 border-indigo-50 pb-6">
            <div className="p-3 bg-sky-600 text-white">
              <UserPlus className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">Add New Admin</h2>
          </div>

          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold"
                  placeholder="USERNAME"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold"
                  placeholder="••••••••"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-sky-600 text-white py-4 font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-sky-100"
            >
              Create Admin Account
            </button>
          </form>
        </div>

        {/* Update Admin Card (Conditional) */}
        {updateAdmin && (
          <div className="bg-white border-4 border-sky-600 shadow-2xl p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4 border-b-4 border-indigo-50 pb-6">
              <div className="p-3 bg-sky-600 text-white">
                <UserCog className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">Update Admin</h2>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold"
                    placeholder="USERNAME"
                    value={updateAdmin.username}
                    onChange={(e) => setUpdateAdmin({ ...updateAdmin, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Password (Leave blank to keep current)</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 focus:ring-4 focus:ring-sky-200 transition-all font-bold"
                    placeholder="••••••••"
                    value={updateAdmin.password || ""}
                    onChange={(e) => setUpdateAdmin({ ...updateAdmin, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 text-white py-4 font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-sky-100"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateAdmin(null)}
                  className="px-8 bg-gray-100 text-gray-900 py-4 font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins List Card */}
        <div className="bg-white border-4 border-white shadow-2xl p-8 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-4 border-b-4 border-indigo-50 pb-6">
            <div className="p-3 bg-gray-900 text-white">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">Current Admins</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="group flex items-center justify-between p-6 bg-gray-50 border-4 border-transparent hover:border-sky-600 transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">Admin User</span>
                  <span className="text-lg font-black text-gray-900">{admin.username}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setUpdateAdmin({ id: admin.id, username: admin.username })}
                    className="p-3 hover:bg-sky-600 hover:text-white transition-colors text-sky-600"
                    title="Edit Admin"
                  >
                    <UserCog className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAdmin(admin.id)}
                    className="p-3 hover:bg-red-600 hover:text-white transition-colors text-red-600"
                    title="Delete Admin"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {admins.length === 0 && !loading && (
            <p className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest italic">
              No other admins found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
