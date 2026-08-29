'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Mail, 
  ShieldCheck, 
  Plus, 
  X, 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Sliders, 
  RefreshCw, 
  Check, 
  Copy,
  Gamepad2,
  Layers,
  Users as UsersIcon,
  FileText,
  ImageIcon,
  Server as ServerIcon
} from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';
import styles from '../app/admin/page.module.css';

export interface UserAccount {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  permissions?: string[];
  is_blocked: boolean;
  plain_password?: string;
  created_at: string;
}

export const ADMIN_MODULES = [
  { id: 'games', label: 'Game Management', icon: Gamepad2, desc: 'Upload, edit, delete and activate games' },
  { id: 'categories', label: 'Category Management', icon: Layers, desc: 'Create, reorder, and assign games to categories' },
  { id: 'users', label: 'User Management', icon: UsersIcon, desc: 'View, search, and block registered gamers' },
  { id: 'content', label: 'Content Management', icon: FileText, desc: 'Edit About, Privacy, and Terms page content' },
  { id: 'blogs', label: 'Blog Management', icon: FileText, desc: 'Create, publish, edit, and delete blog posts' },
  { id: 'media', label: 'Media Library', icon: ImageIcon, desc: 'Upload and delete media images and assets' },
  { id: 'server', label: 'Server Details', icon: ServerIcon, desc: 'View live server storage, CPU, RAM, and game files' },
];

const ALL_MODULE_IDS = ADMIN_MODULES.map(m => m.id);

interface FilterSelectOption {
  value: string;
  label: string;
}

interface CustomFilterSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: FilterSelectOption[];
  width?: string;
}

const CustomFilterSelect: React.FC<CustomFilterSelectProps> = ({ value, onChange, options, width = '180px' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} className={styles.customSelectContainer} style={{ width }}>
      <div 
        className={styles.customSelectTrigger} 
        onClick={() => setIsOpen(!isOpen)}
        style={{ height: '36px', padding: '0 12px' }}
      >
        <span style={{ fontSize: '0.85rem' }}>{activeOption.label}</span>
        <ChevronDown size={14} className={`${styles.selectArrow} ${isOpen ? styles.selectArrowOpen : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.customSelectDropdown} style={{ top: 'calc(100% + 4px)', zIndex: 100 }}>
          <div className={styles.customSelectOptionsList} style={{ maxHeight: '250px' }}>
            {options.map((opt) => (
              <div 
                key={opt.value} 
                className={`${styles.customSelectOption} ${value === opt.value ? styles.customSelectOptionActive : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const adminStatusOptions: FilterSelectOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' }
];

const adminRoleOptions: FilterSelectOption[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' }
];

const adminSortOptions: FilterSelectOption[] = [
  { value: 'role_desc', label: 'Authority Rank' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'email_asc', label: 'Email / Username (A-Z)' },
  { value: 'email_desc', label: 'Email / Username (Z-A)' },
  { value: 'newest', label: 'Newest Registered' },
  { value: 'oldest', label: 'Oldest Registered' }
];

export default function AdminsManager() {
  const { admin, token, globalSearchQuery, setGlobalSearchQuery } = useAdminStore();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Per-user password visibility state for table
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Copied password state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopyPassword = (userId: string, pass: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Create Admin Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPermissions, setNewPermissions] = useState<string[]>(ALL_MODULE_IDS);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState({ text: '', type: '' });

  // Permissions Modal State
  const [permModalUser, setPermModalUser] = useState<UserAccount | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [permSaving, setPermSaving] = useState(false);

  // Password Reset Modal State
  const [passModalUser, setPassModalUser] = useState<UserAccount | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [passSaving, setPassSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ id: number; type: 'warning' | 'error' | 'success' | 'info'; title: string; message: string } | null>(null);
  const showToast = (message: string, type: 'warning' | 'error' | 'success' | 'info' = 'info', title?: string) => {
    const toastTitle = title || (type === 'warning' ? 'Notice' : type === 'error' ? 'Action Failed' : type === 'success' ? 'Success' : 'Notification');
    setToast({ id: Date.now(), type, title: toastTitle, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewPermissions(ALL_MODULE_IDS);
    setShowCreatePassword(false);
    setCreateMessage({ text: '', type: '' });
    setCreateModalOpen(true);
  };

  const handleGenerateRandomPass = (target: 'create' | 'reset') => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let generated = 'Gs@';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (target === 'create') {
      setNewPassword(generated);
      setShowCreatePassword(true);
    } else {
      setNewResetPassword(generated);
      setShowResetPass(true);
    }
  };

  // Open Permissions Modal for specific admin
  const handleOpenPermModal = (account: UserAccount) => {
    setPermModalUser(account);
    const existing = account.permissions && account.permissions.length > 0 ? account.permissions : ALL_MODULE_IDS;
    setSelectedPerms(existing);
  };

  // Toggle specific permission checkbox
  const handleTogglePerm = (permId: string) => {
    setSelectedPerms(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const currentUserRole = admin?.role || 'USER';
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';

  // Save updated permissions
  const handleSavePermissions = async () => {
    if (!permModalUser) return;
    setPermSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/admins/${permModalUser.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: selectedPerms }),
      });

      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === permModalUser.id ? { ...u, permissions: selectedPerms } : u));
        showToast(`Permissions updated for ${permModalUser.name || permModalUser.email}!`, 'success');
        setPermModalUser(null);
      } else {
        showToast(data.error || 'Failed to update permissions', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to backend.', 'error');
    } finally {
      setPermSaving(false);
    }
  };

  // Open Change Password Modal
  const handleOpenPassModal = (account: UserAccount) => {
    setPassModalUser(account);
    setNewResetPassword('');
    setShowResetPass(false);
  };

  // Save new password
  const handleSavePassword = async () => {
    if (!passModalUser) return;
    if (!newResetPassword || newResetPassword.length < 8) {
      showToast('Password must be at least 8 characters long!', 'warning');
      return;
    }

    setPassSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/admins/${passModalUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newResetPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === passModalUser.id ? { ...u, plain_password: newResetPassword } : u));
        showToast(`Password successfully updated for ${passModalUser.name || passModalUser.email}!`, 'success');
        setPassModalUser(null);
      } else {
        showToast(data.error || 'Failed to reset password', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to backend.', 'error');
    } finally {
      setPassSaving(false);
    }
  };

  // Search, Filters & Sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('role_desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const itemsPerPage = 10;

  // Filter & sort logic
  const filteredAndSortedUsers = React.useMemo(() => {
    let result = [...users];

    // Search
    if (globalSearchQuery.trim()) {
      const query = globalSearchQuery.toLowerCase();
      result = result.filter(u => 
        (u.name && u.name.toLowerCase().includes(query)) ||
        u.email.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter === 'active') {
      result = result.filter(u => !u.is_blocked);
    } else if (statusFilter === 'blocked') {
      result = result.filter(u => u.is_blocked);
    }

    // Role Filter
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'role_desc') {
        if (a.role !== b.role) {
          return a.role === 'SUPER_ADMIN' ? -1 : 1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'email_asc') {
        return a.email.localeCompare(b.email);
      }
      if (sortBy === 'email_desc') {
        return b.email.localeCompare(a.email);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return 0;
    });

    return result;
  }, [users, globalSearchQuery, statusFilter, roleFilter, sortBy]);

  // Paginated slice
  const paginatedUsers = React.useMemo(() => {
    if (!paginationEnabled) return filteredAndSortedUsers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage, paginationEnabled]);

  const totalPages = paginationEnabled ? (Math.ceil(filteredAndSortedUsers.length / itemsPerPage) || 1) : 1;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearchQuery, statusFilter, roleFilter, sortBy, paginationEnabled]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/admin/admins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch administrator list');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      setError('Only Super Admins can access this panel.');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [isSuperAdmin]);

  const handleToggleBlock = async (userId: string, currentBlockStatus: boolean) => {
    const newBlockStatus = !currentBlockStatus;
    setActionLoading(userId + '-block');
    try {
      const res = await fetch(`${backendUrl}/api/admin/admins/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_blocked: newBlockStatus }),
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: newBlockStatus } : u));
        showToast(`Admin ${newBlockStatus ? 'blocked' : 'unblocked'} successfully!`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update block status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to backend.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword) {
      setCreateMessage({ text: 'Username/Email and password are required!', type: 'error' });
      return;
    }

    if (newPassword.length < 8) {
      setCreateMessage({ text: 'Password must be at least 8 characters long!', type: 'error' });
      return;
    }

    if (newPermissions.length === 0) {
      setCreateMessage({ text: 'Please select at least one permitted module!', type: 'error' });
      return;
    }

    setCreateLoading(true);
    setCreateMessage({ text: '', type: '' });

    try {
      const res = await fetch(`${backendUrl}/api/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim() || null,
          role: 'ADMIN',
          password: newPassword,
          permissions: newPermissions
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCreateMessage({ text: 'Admin account created successfully!', type: 'success' });
        setUsers(prev => [data, ...prev]);
        
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewPermissions(ALL_MODULE_IDS);

        setTimeout(() => {
          setCreateModalOpen(false);
          setCreateMessage({ text: '', type: '' });
        }, 1200);
      } else {
        setCreateMessage({ text: data.error || 'Failed to create admin', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setCreateMessage({ text: 'Failed to connect to backend.', type: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>Loading admin accounts...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--color-danger)' }}>
        <ShieldAlert size={40} />
        <h2 style={{ color: 'white' }}>Super Admin Console Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'success' ? '#065f46' : toast.type === 'warning' ? '#854d0e' : '#991b1b',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {toast.type === 'success' ? <Check size={18} /> : <ShieldAlert size={18} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{toast.title}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{toast.message}</div>
          </div>
        </div>
      )}

      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>
            Admin Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure granular sub-admin module permissions, reset credentials, or block access.
          </p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3 className={styles.chartTitle} style={{ border: 'none', padding: 0, margin: 0 }}>Administrator Accounts ({filteredAndSortedUsers.length})</h3>
          <div className={styles.tableHeaderControls}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px', userSelect: 'none' }}>
              <label 
                style={{ 
                  fontSize: '0.8rem', 
                  color: '#94a3b8', 
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={paginationEnabled}
                  onChange={(e) => setPaginationEnabled(e.target.checked)}
                  style={{
                    cursor: 'pointer',
                    width: '14px',
                    height: '14px',
                    accentColor: '#14b8a6'
                  }}
                />
                Paginate
              </label>
            </div>
            <div className={styles.tableSearchWrapper} style={{ marginRight: '8px' }}>
              <Search size={15} className={styles.tableSearchIcon} />
              <input
                type="text"
                placeholder="Search name or username..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className={styles.tableSearchInput}
              />
            </div>
            <button className={styles.addGameBtn} onClick={handleOpenCreateModal} style={{ height: '36px', padding: '0 16px', fontSize: '0.82rem' }}>
              <Plus size={15} /> Create Admin
            </button>
          </div>
        </div>

        {/* Filters and Sorting Row */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', padding: '0.85rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', alignItems: 'center' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', fontWeight: 500 }}>Status:</span>
            <CustomFilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={adminStatusOptions}
              width="140px"
            />
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', fontWeight: 500 }}>Role:</span>
            <CustomFilterSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={adminRoleOptions}
              width="140px"
            />
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', fontWeight: 500 }}>Sort By:</span>
            <CustomFilterSelect
              value={sortBy}
              onChange={setSortBy}
              options={adminSortOptions}
              width="190px"
            />
          </div>
        </div>

        <div className={styles.tableWrapper} style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '34px' }}>Name</th>
                <th>Username / Email</th>
                <th>Password</th>
                <th>Module Access</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Status</th>
                <th style={{ width: '170px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((account, index) => {
                  const isSuper = account.role === 'SUPER_ADMIN';
                  const perms = account.permissions || ALL_MODULE_IDS;
                  const permCount = isSuper ? ALL_MODULE_IDS.length : perms.length;

                  return (
                    <tr key={account.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: '20px', textAlign: 'center', display: 'inline-block' }}>
                            {paginationEnabled ? (currentPage - 1) * itemsPerPage + index + 1 : index + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--adm-text-primary, #ffffff)' }}>{account.name || 'Admin'}</div>
                            <span style={{ 
                              fontSize: '0.72rem', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontWeight: 700,
                              background: isSuper ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: isSuper ? '#f43f5e' : '#38bdf8',
                              display: 'inline-block',
                              marginTop: '2px'
                            }}>
                              {isSuper ? 'SUPER ADMIN' : 'SUB ADMIN'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.85rem' }}>
                          <Mail size={13} /> {account.email}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <code style={{ 
                            background: 'rgba(255, 255, 255, 0.06)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '6px', 
                            fontSize: '0.82rem', 
                            color: '#f59e0b', 
                            fontFamily: 'monospace',
                            letterSpacing: showPasswords[account.id] ? '0.5px' : '2px' 
                          }}>
                            {showPasswords[account.id] 
                              ? (account.plain_password || '••••••••') 
                              : '••••••••'
                            }
                          </code>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(account.id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: showPasswords[account.id] ? '#14b8a6' : 'var(--text-secondary, #94a3b8)', 
                              cursor: 'pointer', 
                              padding: '4px', 
                              display: 'flex', 
                              alignItems: 'center',
                              borderRadius: '4px'
                            }}
                            title={showPasswords[account.id] ? 'Hide Password' : 'Show Password'}
                          >
                            {showPasswords[account.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          {account.plain_password && (
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(account.id, account.plain_password!)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: copiedId === account.id ? '#10b981' : '#64748b',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Copy Password"
                            >
                              {copiedId === account.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Module Access / Permissions Column */}
                      <td>
                        {isSuper ? (
                          <span style={{ 
                            fontSize: '0.78rem', 
                            fontWeight: 600, 
                            color: '#10b981', 
                            background: 'rgba(16, 185, 129, 0.12)', 
                            padding: '4px 8px', 
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <ShieldCheck size={13} /> Full Access ({ALL_MODULE_IDS.length}/{ALL_MODULE_IDS.length})
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '0.78rem', 
                              fontWeight: 600, 
                              color: permCount > 0 ? '#38bdf8' : '#ef4444', 
                              background: permCount > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                              padding: '4px 8px', 
                              borderRadius: '6px'
                            }}>
                              {permCount} of {ALL_MODULE_IDS.length} Modules Active
                            </span>
                            <button
                              onClick={() => handleOpenPermModal(account)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#e2e8f0',
                                cursor: 'pointer',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              title="Configure Module Permissions"
                            >
                              <Sliders size={12} /> Configure
                            </button>
                          </div>
                        )}
                      </td>
                      
                      {/* Status Column */}
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        {account.id !== admin?.id && !isSuper ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: account.is_blocked ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600, width: '50px', display: 'inline-block', textAlign: 'left' }}>
                              {account.is_blocked ? 'Blocked' : 'Active'}
                            </span>
                            <button 
                              className={`${styles.toggleSwitch} ${!account.is_blocked ? styles.toggleSwitchActive : ''}`}
                              onClick={() => !actionLoading && handleToggleBlock(account.id, account.is_blocked)}
                              disabled={actionLoading === account.id + '-block'}
                              style={{ 
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                padding: 0,
                                borderStyle: 'solid',
                                display: 'inline-block'
                              }}
                              title={account.is_blocked ? 'Unblock Admin' : 'Block Admin'}
                            >
                              <div className={styles.toggleKnob} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Protected</span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenPassModal(account)}
                            style={{
                              background: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              color: '#fbbf24',
                              cursor: 'pointer',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'background 0.2s ease'
                            }}
                            title="Reset / Change Password"
                          >
                            <KeyRound size={13} /> Change Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No administrators found matching search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {paginationEnabled && filteredAndSortedUsers.length > 0 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} administrators
            </div>
            <div className={styles.paginationPages}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
              >
                <ChevronLeft size={16} />
              </button>
              
              {getPageNumbers().map((pageNum, idx) => (
                typeof pageNum === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`${styles.paginationBtn} ${currentPage === pageNum ? styles.paginationBtnActive : ''}`}
                  >
                    {pageNum}
                  </button>
                ) : (
                  <span key={idx} style={{ padding: '0 6px', color: 'var(--text-secondary)', alignSelf: 'center', fontSize: '0.85rem', userSelect: 'none' }}>
                    {pageNum}
                  </span>
                )
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Configuration Modal */}
      {permModalUser && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="#38bdf8" /> Configure Module Access
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  User: <strong style={{ color: '#fff' }}>{permModalUser.name || permModalUser.email}</strong> ({permModalUser.email})
                </div>
              </div>
              <button onClick={() => setPermModalUser(null)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Action Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
                Select modules enabled for this Sub-Admin:
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPerms(ALL_MODULE_IDS)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms([])}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Permissions List Matrix */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
              {ADMIN_MODULES.map((mod) => {
                const isChecked = selectedPerms.includes(mod.id);
                const IconComponent = mod.icon;
                return (
                  <label 
                    key={mod.id} 
                    onClick={() => handleTogglePerm(mod.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isChecked ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: isChecked ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      userSelect: 'none'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => {}} // Handled by label onClick
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                        accentColor: '#38bdf8'
                      }}
                    />
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '6px', 
                      background: isChecked ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isChecked ? '#38bdf8' : '#94a3b8'
                    }}>
                      <IconComponent size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isChecked ? '#ffffff' : '#94a3b8' }}>
                        {mod.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {mod.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => setPermModalUser(null)}
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  background: 'rgba(255,255,255,0.06)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSavePermissions}
                disabled={permSaving}
                className={styles.uploadBtn}
                style={{ flex: 2, padding: '0.75rem', justifyContent: 'center', fontSize: '0.85rem' }}
              >
                {permSaving ? 'Saving Changes...' : `Save Access (${selectedPerms.length} Enabled)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passModalUser && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={18} color="#fbbf24" /> Change Admin Password
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Admin: <strong style={{ color: '#fff' }}>{passModalUser.name || passModalUser.email}</strong>
                </div>
              </div>
              <button onClick={() => setPassModalUser(null)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>New Password</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateRandomPass('reset')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    <RefreshCw size={12} /> Generate Random
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showResetPass ? 'text' : 'password'} 
                    required
                    autoComplete="new-password"
                    placeholder="Enter at least 8 characters"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className={styles.figmaInput}
                    style={{ paddingRight: '2.5rem', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showResetPass ? 'Hide Password' : 'Show Password'}
                  >
                    {showResetPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setPassModalUser(null)}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    background: 'rgba(255,255,255,0.06)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSavePassword}
                  disabled={passSaving || newResetPassword.length < 8}
                  className={styles.uploadBtn}
                  style={{ 
                    flex: 2, 
                    padding: '0.75rem', 
                    justifyContent: 'center', 
                    fontSize: '0.85rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    cursor: (passSaving || newResetPassword.length < 8) ? 'not-allowed' : 'pointer',
                    opacity: newResetPassword.length < 8 ? 0.6 : 1
                  }}
                >
                  {passSaving ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Credentials Modal */}
      {createModalOpen && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: '1.25rem' }}>Create Admin Account</h3>
              <button onClick={() => setCreateModalOpen(false)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            {createMessage.text && (
              <div 
                className={styles.message} 
                style={{ 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  marginBottom: '1rem',
                  background: createMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: createMessage.type === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                  color: createMessage.type === 'error' ? '#ef4444' : '#10b981'
                }}
              >
                {createMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  name="create_admin_fullname"
                  placeholder="e.g. Akshay Dalvi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={styles.figmaInput}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Username / Email</label>
                <input 
                  type="text" 
                  required
                  autoComplete="off"
                  name="create_admin_username_field"
                  placeholder="e.g. akshay_dalvi or akshay@gamesato.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={styles.figmaInput}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateRandomPass('create')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    <RefreshCw size={12} /> Generate Random
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showCreatePassword ? 'text' : 'password'} 
                    required
                    autoComplete="new-password"
                    name="create_admin_password_field"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.figmaInput}
                    style={{ paddingRight: '2.5rem', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showCreatePassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Module Access Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Enabled Modules</label>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{newPermissions.length} selected</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '160px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                  {ADMIN_MODULES.map(mod => {
                    const isChecked = newPermissions.includes(mod.id);
                    return (
                      <label 
                        key={mod.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '0.78rem', 
                          color: isChecked ? '#fff' : '#64748b', 
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          background: isChecked ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            setNewPermissions(prev => 
                              prev.includes(mod.id) ? prev.filter(p => p !== mod.id) : [...prev, mod.id]
                            );
                          }}
                          style={{ width: '13px', height: '13px', accentColor: '#38bdf8', cursor: 'pointer' }}
                        />
                        <span>{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={createLoading}
                className={styles.uploadBtn}
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', justifyContent: 'center' }}
              >
                {createLoading ? 'Creating Account...' : 'Create Admin Credentials'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
