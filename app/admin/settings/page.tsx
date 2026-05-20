"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCog, Trash2, Key, User } from "lucide-react";
import toast from "react-hot-toast";

interface Admin {
  id: string;
  username: string;
}

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });
  const [updateAdmin, setUpdateAdmin] = useState<{ id: string; username: string; password?: string } | null>(null);

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

  useEffect(() => {
    fetchAdmins();
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

  return (
    <div className="p-8 space-y-8 bg-indigo-50/10 min-h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
          Admin <span className="text-sky-600">Settings</span>
        </h1>
        <p className="text-gray-500 font-medium lowercase tracking-tight">
          Manage your administrative team and credentials.
        </p>
      </div>

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
