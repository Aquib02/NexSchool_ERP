import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Users,
  Key,
  Lock,
  Plus,
  Edit2,
  Check,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Sliders,
  ChevronRight,
  UserCheck,
  FileKey,
  Layers,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import rbacService from '../../services/rbacService.js';

export const RbacPage = () => {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles', 'matrix', 'users'
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search & Filters
  const [roleSearch, setRoleSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Selected Role for Permissions Matrix
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState(new Set());
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    hierarchyLevel: 5,
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
  });

  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    roleId: '',
    isActive: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getPermissions(),
        rbacService.getUsers(),
      ]);

      const loadedRoles = rolesRes.data?.data || rolesRes.data || [];
      const loadedPerms = permsRes.data?.data || permsRes.data || [];
      const loadedUsers = usersRes.data?.data || usersRes.data || [];

      setRoles(loadedRoles);
      setPermissions(loadedPerms);
      setUsers(loadedUsers);

      if (loadedRoles.length > 0 && !selectedRole) {
        setSelectedRole(loadedRoles[0]);
        setSelectedPermIds(new Set((loadedRoles[0].permissions || []).map((p) => (p._id || p))));
      }
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
      setError(err.response?.data?.message || 'Failed to load RBAC configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected permissions set when active role changes
  useEffect(() => {
    if (selectedRole) {
      const perms = selectedRole.permissions || [];
      setSelectedPermIds(new Set(perms.map((p) => (typeof p === 'object' ? p._id : p))));
    }
  }, [selectedRole]);

  // Group permissions by category/resource
  const permissionsByCategory = useMemo(() => {
    const map = {};
    permissions.forEach((p) => {
      const cat = (p.category || p.resource || 'GENERAL').toUpperCase();
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [permissions]);

  // Filtered lists
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.displayName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [roles, roleSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.displayName?.toLowerCase().includes(q) ||
        u.role?.name?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  // Handle Permission Toggle
  const handleTogglePermission = (permId) => {
    const next = new Set(selectedPermIds);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedPermIds(next);
  };

  // Toggle Category
  const handleToggleCategory = (categoryPerms) => {
    const allSelected = categoryPerms.every((p) => selectedPermIds.has(p._id));
    const next = new Set(selectedPermIds);
    categoryPerms.forEach((p) => {
      if (allSelected) {
        next.delete(p._id);
      } else {
        next.add(p._id);
      }
    });
    setSelectedPermIds(next);
  };

  // Save Role Permissions
  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setIsSavingPerms(true);
      setError(null);
      const res = await rbacService.updateRole(selectedRole._id, {
        permissions: Array.from(selectedPermIds),
      });

      const updatedRole = res.data?.data || res.data;
      setRoles((prev) => prev.map((r) => (r._id === selectedRole._id ? updatedRole : r)));
      setSelectedRole(updatedRole);
      setSuccessMessage(`Permissions for role '${selectedRole.displayName}' updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Failed to save permissions:', err);
      setError(err.response?.data?.message || 'Failed to save role permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Create Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await rbacService.createRole({
        name: roleForm.name.toUpperCase().trim(),
        displayName: roleForm.displayName.trim(),
        description: roleForm.description.trim(),
        hierarchyLevel: Number(roleForm.hierarchyLevel),
        permissions: [],
      });

      const newRole = res.data?.data || res.data;
      setRoles((prev) => [...prev, newRole]);
      setIsRoleModalOpen(false);
      setRoleForm({ name: '', displayName: '', description: '', hierarchyLevel: 5 });
      setSuccessMessage(`Role '${newRole.displayName}' created successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create role');
    }
  };

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await rbacService.createUser({
        username: userForm.username.trim(),
        email: userForm.email.trim() || undefined,
        password: userForm.password,
        roleId: userForm.roleId,
      });

      const newUser = res.data?.data || res.data;
      setUsers((prev) => [newUser, ...prev]);
      setIsUserModalOpen(false);
      setUserForm({ username: '', email: '', password: '', roleId: '' });
      setSuccessMessage(`User account '${newUser.username}' created successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  // Edit User Role
  const handleUpdateUserRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setError(null);
      const res = await rbacService.updateUserRole(editingUser._id, {
        roleId: editUserForm.roleId,
        isActive: editUserForm.isActive,
      });

      const updated = res.data?.data || res.data;
      setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? updated : u)));
      setEditUserModalOpen(false);
      setEditingUser(null);
      setSuccessMessage(`User '${updated.username}' updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 font-medium text-sm">Loading RBAC security permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" className="bg-indigo-500/10 text-indigo-700 border-indigo-200">
              Security & Access Control
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Roles & RBAC Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system roles, fine-tune granular permission matrix, and govern staff credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={UserCheck}
            onClick={() => setIsUserModalOpen(true)}
          >
            Create User Account
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsRoleModalOpen(true)}
          >
            Create Custom Role
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:text-rose-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active System Roles</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{roles.length}</p>
            <span className="text-[11px] font-semibold text-indigo-600 mt-0.5 inline-block">
              Standard & Custom Roles
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Granular Permissions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{permissions.length}</p>
            <span className="text-[11px] font-semibold text-emerald-600 mt-0.5 inline-block">
              Across {Object.keys(permissionsByCategory).length} Modules
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Registered User Logins</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5 inline-block">
              {users.filter((u) => u.isActive).length} Active Accounts
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Hierarchy Scope</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">Level 0 &rarr; 9</p>
            <span className="text-[11px] font-semibold text-amber-600 mt-0.5 inline-block">
              Tiered Access Control
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'roles'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          Roles Catalog ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          User Accounts & Roles ({users.length})
        </button>
      </div>

      {/* TAB 1: ROLES CATALOG */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles by name or description..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredRoles.length} of {roles.length} Roles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <div
                key={role._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                      {role.name}
                    </span>
                    <Badge variant={role.isSystem ? 'neutral' : 'primary'}>
                      {role.isSystem ? 'System Core' : 'Custom Role'}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{role.displayName}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {role.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Hierarchy Level</p>
                    <p className="font-bold text-slate-700">Level {role.hierarchyLevel}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Permissions</p>
                    <p className="font-bold text-indigo-600">
                      {role.permissions?.length || 0} Grants
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Sliders}
                  className="w-full text-xs justify-center"
                  onClick={() => {
                    setSelectedRole(role);
                    setActiveTab('matrix');
                  }}
                >
                  Configure Permissions &rarr;
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          {/* Role Selector Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Configuring Role</p>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedRole?.displayName || 'Select a Role'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <select
                value={selectedRole?._id || ''}
                onChange={(e) => {
                  const r = roles.find((item) => item._id === e.target.value);
                  if (r) setSelectedRole(r);
                }}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.displayName} ({r.name})
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                size="sm"
                icon={Check}
                isLoading={isSavingPerms}
                onClick={handleSavePermissions}
              >
                Save Role Permissions
              </Button>
            </div>
          </div>

          {/* Module Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(permissionsByCategory).map(([category, perms]) => {
              const allChecked = perms.every((p) => selectedPermIds.has(p._id));

              return (
                <div
                  key={category}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <h4 className="font-bold text-xs text-slate-900 tracking-wide">
                        {category} MODULE
                      </h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-md font-semibold">
                        {perms.filter((p) => selectedPermIds.has(p._id)).length} / {perms.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCategory(perms)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      {allChecked ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {perms.map((p) => {
                      const isChecked = selectedPermIds.has(p._id);
                      return (
                        <label
                          key={p._id}
                          className={`flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer border transition-colors ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200/80 text-indigo-950 font-medium'
                              : 'hover:bg-slate-50 border-transparent text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p._id)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <p className="text-xs leading-snug font-semibold text-slate-800">
                              {p.code}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {p.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: USER ACCOUNTS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by username, email, or role..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsUserModalOpen(true)}
            >
              Add User Account
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5 font-semibold">User Account</th>
                    <th className="p-3.5 font-semibold">Email Address</th>
                    <th className="p-3.5 font-semibold">Assigned Role</th>
                    <th className="p-3.5 font-semibold text-center">Status</th>
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 uppercase">
                            {u.username[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {u.username}
                            </p>
                            <p className="text-[10px] text-slate-400">ID: {u._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600">
                        {u.email || <span className="text-slate-400 italic">None</span>}
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                          {u.role?.displayName || u.role?.name || 'No Role Assigned'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => {
                            setEditingUser(u);
                            setEditUserForm({
                              roleId: u.role?._id || '',
                              isActive: u.isActive !== false,
                            });
                            setEditUserModalOpen(true);
                          }}
                        >
                          Modify Role
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ROLE MODAL */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Create Custom School Role"
        subtitle="Define a new role and establish its rank in the school access hierarchy"
      >
        <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Role Code (Uppercase, No spaces) *</label>
            <input
              type="text"
              required
              placeholder="e.g. OFFICE_CLERK"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Display Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Office Front Desk Clerk"
              value={roleForm.displayName}
              onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Explain responsibilities and permissions for this role..."
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Hierarchy Level (0=Highest Root, 9=Lowest) *</label>
            <input
              type="number"
              required
              min={1}
              max={9}
              value={roleForm.hierarchyLevel}
              onChange={(e) => setRoleForm({ ...roleForm, hierarchyLevel: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Plus}>
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Create New User Account"
        subtitle="Provision initial credentials and assign a system role"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Username *</label>
            <input
              type="text"
              required
              placeholder="e.g. rahul_clerk"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. rahul@school.com"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Initial Password *</label>
            <input
              type="password"
              required
              placeholder="Min 6 characters"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Assign Role *</label>
            <select
              required
              value={userForm.roleId}
              onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Select System Role...</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.displayName} ({r.name})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={UserCheck}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER ROLE MODAL */}
      <Modal
        isOpen={editUserModalOpen}
        onClose={() => {
          setEditUserModalOpen(false);
          setEditingUser(null);
        }}
        title="Modify User Role & Status"
        subtitle={`Update permissions and login status for ${editingUser?.username}`}
      >
        <form onSubmit={handleUpdateUserRole} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Username</label>
            <input
              type="text"
              disabled
              value={editingUser?.username || ''}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Assigned Role *</label>
            <select
              required
              value={editUserForm.roleId}
              onChange={(e) => setEditUserForm({ ...editUserForm, roleId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Select Role...</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.displayName} ({r.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editUserForm.isActive}
              onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="font-semibold cursor-pointer">
              Account Active & Enabled for Login
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditUserModalOpen(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Check}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RbacPage;
