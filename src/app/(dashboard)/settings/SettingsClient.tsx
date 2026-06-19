"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  User as UserIcon,
  Building,
  Users,
  Bell,
  Save,
  CheckCircle,
  Plus,
  X,
  ShieldAlert,
  Edit2,
  Trash2,
  Key,
} from "lucide-react";
import { updateUserProfile, updateCompanyDetails, createUser, updateUser, deleteUser } from "../../actions";
import { useUserRole } from "@/hooks/useUserRole";

interface SettingsClientProps {
  initialUser: any;
  initialUsers: any[];
  initialCompany: any;
  lowStockCount: number;
}

export default function SettingsClient({
  initialUser,
  initialUsers,
  initialCompany,
  lowStockCount,
}: SettingsClientProps) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [company, setCompany] = useState(initialCompany);
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "company" | "users" | "notifications">("profile");
  const { isAdmin, isManager } = useUserRole();
  const canEdit = isAdmin || isManager;

  // Profile forms
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load active user session on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userSession");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          setName(parsed.name || "");
          setEmail(parsed.email || "");
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Company forms
  const [compName, setCompName] = useState(company?.name || "Bidwest Ghana Ltd");
  const [compAddress, setCompAddress] = useState(company?.address || "Plot 14, Spintex Road, Industrial Area, Accra");
  const [compCountry, setCompCountry] = useState(company?.country || "Ghana");
  const [compCurrency, setCompCurrency] = useState(company?.currency || "GHS");

  // New User forms
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("Staff");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Submit Profile update
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveStatus(null);
    try {
      const updateData: any = { name, email };
      if (password) {
        updateData.password = password;
      }
      const updated = await updateUserProfile(currentUser.id, updateData);
      setCurrentUser(updated);
      setSaveStatus("Profile updated successfully!");
      setPassword("");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus(err.message || "Failed to update profile.");
    }
  };

  // Submit Company details update
  const handleSaveCompany = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveStatus(null);
    try {
      const updated = await updateCompanyDetails({
        id: company?.id,
        name: compName,
        address: compAddress,
        country: compCountry,
        currency: compCurrency,
      });
      setCompany(updated);
      setSaveStatus("Company settings updated successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus(err.message || "Failed to update company details.");
    }
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);

    if (!newUserName || !newUserEmail || !newUserPassword) {
      setUserError("Please fill in all fields.");
      return;
    }

    try {
      const newUser = await createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      setUsers((prev) => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddUserModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("Staff");
      setSaveStatus("New user account created successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setUserError(err.message || "Failed to create user.");
    }
  };

  // Edit user states
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("Staff");

  // Reset password states
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  const triggerEditUser = (u: any) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
    setEditUserRole(u.role);
    setUserError(null);
    setIsEditUserModalOpen(true);
  };

  const triggerResetPassword = (u: any) => {
    setResetPasswordUser(u);
    setResetPasswordValue("");
    setUserError(null);
    setIsResetPasswordModalOpen(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    if (!editingUser) return;
    try {
      const updated = await updateUser(editingUser.id, {
        name: editUserName,
        email: editUserEmail,
        role: editUserRole,
      });

      // Update local state
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u)));
      
      // If we edited ourselves, update currentUser state as well
      if (editingUser.id === currentUser.id) {
        setCurrentUser((prev: any) => ({ ...prev, ...updated }));
        // Also update local storage session
        const stored = localStorage.getItem("userSession");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorage.setItem("userSession", JSON.stringify({ ...parsed, ...updated }));
          } catch (e) {
            console.error(e);
          }
        }
      }

      setIsEditUserModalOpen(false);
      setSaveStatus("User details updated successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setUserError(err.message || "Failed to update user.");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    if (!resetPasswordUser) return;
    if (resetPasswordValue.length < 4) {
      setUserError("Password must be at least 4 characters long.");
      return;
    }
    try {
      await updateUser(resetPasswordUser.id, {
        password: resetPasswordValue,
      });
      setIsResetPasswordModalOpen(false);
      setSaveStatus(`Password for ${resetPasswordUser.name} has been reset successfully.`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setUserError(err.message || "Failed to reset password.");
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setSaveStatus("User account deleted successfully.");
      setTimeout(() => setSaveStatus(null), 3000);
      setUserToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
      setUserToDelete(null);
    }
  };

  return (
    <>
        <Header
          title="Settings"
          subtitle="Manage your account, company, and system preferences"
          lowStockCount={lowStockCount}
          actions={
            activeSubTab === "profile" ? (
              <button
                onClick={() => handleSaveProfile()}
                className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-[#b0220a] transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            ) : activeSubTab === "company" && canEdit ? (
              <button
                onClick={() => handleSaveCompany()}
                className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-[#b0220a] transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Company</span>
              </button>
            ) : activeSubTab === "users" && canEdit ? (
              <button
                onClick={() => {
                  setUserError(null);
                  setIsAddUserModalOpen(true);
                }}
                className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-[#b0220a] transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            ) : null
          }
        />

        <div className="flex-1 flex flex-col lg:flex-row border-t border-border">
          {/* Settings Left sub-navigation */}
          <div className="w-full lg:w-48 border-r border-border bg-card flex flex-row lg:flex-col pt-4 px-3 gap-1 flex-shrink-0 overflow-x-auto lg:overflow-x-visible">
            <button
              onClick={() => setActiveSubTab("profile")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap transition ${
                activeSubTab === "profile"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-[#5c5450] hover:text-foreground hover:bg-input"
              }`}
            >
              <UserIcon className="w-4 h-4 flex-shrink-0" />
              <span>Profile</span>
            </button>

            {canEdit && (
              <button
                onClick={() => setActiveSubTab("company")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap transition ${
                  activeSubTab === "company"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-[#5c5450] hover:text-foreground hover:bg-input"
                }`}
              >
                <Building className="w-4 h-4 flex-shrink-0" />
                <span>Company</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => setActiveSubTab("users")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap transition ${
                  activeSubTab === "users"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-[#5c5450] hover:text-foreground hover:bg-input"
                }`}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Users & Roles</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => setActiveSubTab("notifications")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap transition ${
                  activeSubTab === "notifications"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-[#5c5450] hover:text-foreground hover:bg-input"
                }`}
              >
                <Bell className="w-4 h-4 flex-shrink-0" />
                <span>Notifications</span>
              </button>
            )}
          </div>

          {/* Settings Content block */}
          <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-6">
            {saveStatus && (
              <div className="bg-green-50 border border-green-200 text-success rounded-md p-3 text-xs font-semibold flex items-center gap-2 animate-bounce">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>{saveStatus}</span>
              </div>
            )}

            {activeSubTab === "profile" && (
              /* ============= PROFILE SETTINGS ============= */
              <div className="bg-card border border-border rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-white rounded-t-lg">
                  <h2 className="text-base font-bold font-headings text-foreground">
                    Profile Information
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update your user profile credentials
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="p-6 flex flex-col gap-4 max-w-xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-border pt-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      New Password (Leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-md font-bold hover:bg-[#b0220a] transition mt-2 text-sm font-headings shadow-sm self-start"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {activeSubTab === "company" && (
              /* ============= COMPANY SETTINGS ============= */
              <div className="bg-card border border-border rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-white rounded-t-lg">
                  <h2 className="text-base font-bold font-headings text-foreground">
                    Company Information
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update corporate details of Bidwest Ghana Ltd
                  </p>
                </div>

                <form onSubmit={handleSaveCompany} className="p-6 flex flex-col gap-4 max-w-xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Headquarters Address
                    </label>
                    <input
                      type="text"
                      value={compAddress}
                      onChange={(e) => setCompAddress(e.target.value)}
                      className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Country
                      </label>
                      <input
                        type="text"
                        value={compCountry}
                        onChange={(e) => setCompCountry(e.target.value)}
                        className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        System Currency
                      </label>
                      <input
                        type="text"
                        value={compCurrency}
                        onChange={(e) => setCompCurrency(e.target.value)}
                        className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-md font-bold hover:bg-[#b0220a] transition mt-2 text-sm font-headings shadow-sm self-start"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {activeSubTab === "users" && (
              /* ============= USERS & ROLES SETTINGS ============= */
              <div className="bg-card border border-border rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-white rounded-t-lg flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold font-headings text-foreground">
                      Users & Roles
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Authorized staff accounts that can access Bidwest Inventory System
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUserError(null);
                      setIsAddUserModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-md font-semibold hover:bg-[#b0220a] transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add User</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-input border-b border-border text-left">
                        <th className="px-6 py-3 text-xs text-muted-foreground font-semibold uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase">
                          Role
                        </th>
                        <th className="px-4 py-3 text-xs text-muted-foreground font-semibold uppercase text-center">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs text-muted-foreground font-semibold uppercase text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u.id} className="bg-card hover:bg-background/20">
                          <td className="px-6 py-4 font-semibold text-foreground">
                            {u.name}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {u.email}
                          </td>
                          <td className="px-4 py-4 text-foreground font-semibold">
                            {u.role}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-2 py-0.5 rounded-xl text-xs bg-green-50 text-success border border-green-100 font-semibold">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canEdit && (
                              <div className="flex items-center justify-end gap-1.5">
                                {(isAdmin || u.role !== "Admin") && (
                                  <button
                                    onClick={() => triggerEditUser(u)}
                                    className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-input transition"
                                    title="Edit Details"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {(isAdmin || u.role !== "Admin") && (
                                  <button
                                    onClick={() => triggerResetPassword(u)}
                                    className="p-1 text-muted-foreground hover:text-[#f5a623] rounded hover:bg-input transition"
                                    title="Reset Password"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {isAdmin && u.id !== currentUser.id && (
                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    className="p-1 text-danger hover:text-red-700 rounded hover:bg-red-50 transition"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSubTab === "notifications" && (
              /* ============= NOTIFICATIONS SETTINGS ============= */
              <div className="bg-card border border-border rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-white rounded-t-lg">
                  <h2 className="text-base font-bold font-headings text-foreground">
                    Notification Settings
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure alert triggers for low inventory levels
                  </p>
                </div>

                <div className="p-6 flex flex-col gap-4 text-sm font-semibold text-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">Low Stock Warnings</h4>
                      <p className="text-xs text-muted-foreground">
                        Show active warnings count in header bar
                      </p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-[#e4e4e0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <h4 className="text-sm font-semibold">Email Summary Alert</h4>
                      <p className="text-xs text-muted-foreground">
                        Send daily inventory warning log to company email
                      </p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-[#e4e4e0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* MODAL: ADD USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold font-headings text-foreground">
                Create User Account
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col flex-1">
              <div className="p-6 flex flex-col gap-4 text-xs font-body">
                {userError && (
                  <div className="bg-red-50 border border-red-200 text-danger rounded-md p-3 text-xs font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-danger flex-shrink-0" />
                    <span>{userError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Abena Mensah"
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. abena@bidwestghana.com"
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    System Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                  >
                    <option value="Staff">Staff (Standard Inventory Control)</option>
                    <option value="Manager">Manager (Settings & Reports access)</option>
                    {isAdmin && <option value="Admin">Admin (Full System Privilege)</option>}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-background border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-border bg-card text-foreground rounded-md hover:bg-input transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-md hover:bg-[#b0220a] transition shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold font-headings text-foreground">
                Edit User Details
              </h3>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="flex flex-col flex-1">
              <div className="p-6 flex flex-col gap-4 text-xs font-body">
                {userError && (
                  <div className="bg-red-50 border border-red-200 text-danger rounded-md p-3 text-xs font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-danger flex-shrink-0" />
                    <span>{userError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    System Role
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                  >
                    <option value="Staff">Staff (Standard Inventory Control)</option>
                    <option value="Manager">Manager (Settings & Reports access)</option>
                    {isAdmin && <option value="Admin">Admin (Full System Privilege)</option>}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-background border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-border bg-card text-foreground rounded-md hover:bg-input transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-md hover:bg-[#b0220a] transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {isResetPasswordModalOpen && resetPasswordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold font-headings text-foreground">
                Reset User Password
              </h3>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="flex flex-col flex-1">
              <div className="p-6 flex flex-col gap-4 text-xs font-body">
                {userError && (
                  <div className="bg-red-50 border border-red-200 text-danger rounded-md p-3 text-xs font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-danger flex-shrink-0" />
                    <span>{userError}</span>
                  </div>
                )}

                <div className="bg-muted/40 p-3 rounded-md border border-border text-xs text-muted-foreground mb-2">
                  Resetting password for <span className="font-bold text-foreground">{resetPasswordUser.name}</span> ({resetPasswordUser.email}).
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="border border-border rounded-md px-3 py-2 bg-input text-sm font-semibold outline-none focus:bg-white focus:border-primary transition"
                    required
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-background border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-border bg-card text-foreground rounded-md hover:bg-input transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#f5a623] text-white rounded-md hover:bg-amber-600 transition shadow-sm"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE USER CONFIRMATION */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white">
              <h3 className="text-base font-bold font-headings text-danger flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-danger" />
                <span>Delete User Account</span>
              </h3>
              <button
                onClick={() => setUserToDelete(null)}
                className="p-1 rounded-full hover:bg-input text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <p className="text-sm text-foreground font-semibold leading-relaxed">
                Are you sure you want to delete the user account for <span className="text-primary font-bold">"{userToDelete.name}"</span>?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed bg-red-50/50 border border-red-100 p-2.5 rounded">
                This will permanently disable their access to the system and remove their account record. This action cannot be undone.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-background border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="bg-card border border-border text-foreground hover:bg-input transition px-4 py-2 rounded-md font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUserConfirm}
                className="bg-danger text-white hover:bg-red-700 transition px-4 py-2 rounded-md font-bold text-xs shadow-sm"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
