'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ArrowLeft, Mail, ShieldCheck, UserMinus, Plus, X, Ban, Search, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useAdminStore } from '@/store/useAdminStore';
import styles from '../app/admin/page.module.css';

interface UserAccount {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  is_blocked: boolean;
  plain_password?: string;
  created_at: string;
}

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
  { value: 'email_asc', label: 'Email (A-Z)' },
  { value: 'email_desc', label: 'Email (Z-A)' },
  { value: 'newest', label: 'Newest Registered' },
  { value: 'oldest', label: 'Oldest Registered' }
];

export default function AdminsManager() {
  const { admin, token } = useAdminStore();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Per-user password visibility state for table
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // New admin credentials modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [newPassword, setNewPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState({ text: '', type: '' });

  const handleOpenCreateModal = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setShowCreatePassword(false);
    setCreateMessage({ text: '', type: '' });
    setCreateModalOpen(true);
  };

  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
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
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
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
  }, [users, searchTerm, statusFilter, roleFilter, sortBy]);

  // Paginated slice
  const paginatedUsers = React.useMemo(() => {
    if (!paginationEnabled) return filteredAndSortedUsers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage, paginationEnabled]);

  const totalPages = paginationEnabled ? (Math.ceil(filteredAndSortedUsers.length / itemsPerPage) || 1) : 1;

  // Helper to generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, sortBy, paginationEnabled]);

  const currentUserRole = admin?.role || 'USER';
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';

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

  // Toast state
  const [toast, setToast] = useState<{ id: number; type: 'warning' | 'error' | 'success' | 'info'; title: string; message: string } | null>(null);

  const showToast = (message: string, type: 'warning' | 'error' | 'success' | 'info' = 'info', title?: string) => {
    const toastTitle = title || (type === 'warning' ? 'Notice' : type === 'error' ? 'Action Failed' : type === 'success' ? 'Success' : 'Notification');
    setToast({ id: Date.now(), type, title: toastTitle, message });
  };

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    setActionLoading(userId + '-role');
    try {
      const res = await fetch(`${backendUrl}/api/admin/admins/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        if (newRole === 'USER') {
          setUsers(prev => prev.filter(u => u.id !== userId));
        } else {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        }
        showToast('Admin role updated successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update user role', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to backend.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

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
    if (!newEmail || !newPassword) {
      setCreateMessage({ text: 'Email and password are required!', type: 'error' });
      return;
    }

    if (newPassword.length < 8) {
      setCreateMessage({ text: 'Password must be at least 8 characters long!', type: 'error' });
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
          email: newEmail,
          name: newName || null,
          role: 'ADMIN',
          password: newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCreateMessage({ text: 'Admin account created successfully!', type: 'success' });
        setUsers(prev => [data, ...prev]);
        
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('ADMIN');

        setTimeout(() => {
          setCreateModalOpen(false);
          setCreateMessage({ text: '', type: '' });
        }, 1500);
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
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>
            Admin Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Create new admin credentials, demote, promote, or block system administrators.
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
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              width="180px"
            />
          </div>
        </div>

        <div className={styles.tableWrapper} style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '34px' }}>Name</th>
                <th>Email</th>
                <th>Plain Password</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Status</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Authority</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((account, index) => (
                  <tr key={account.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: '20px', textAlign: 'center', display: 'inline-block' }}>
                          {paginationEnabled ? (currentPage - 1) * itemsPerPage + index + 1 : index + 1}
                        </span>
                        <div style={{ fontWeight: 600, color: 'var(--adm-text-primary, #ffffff)' }}>{account.name || 'Admin'}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>
                        <Mail size={13} /> {account.email}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ 
                          background: 'rgba(255, 255, 255, 0.06)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '0.25rem 0.65rem', 
                          borderRadius: '6px', 
                          fontSize: '0.82rem', 
                          color: '#f59e0b', 
                          fontFamily: 'monospace',
                          letterSpacing: showPasswords[account.id] ? '0.5px' : '2px' 
                        }}>
                          {showPasswords[account.id] 
                            ? (account.plain_password || 'Not Stored') 
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
                            borderRadius: '4px',
                            transition: 'color 0.2s ease'
                          }}
                          title={showPasswords[account.id] ? 'Hide Password' : 'Show Password'}
                        >
                          {showPasswords[account.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </td>
                    
                    {/* Status Column */}
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      {account.id !== admin?.id && account.role !== 'SUPER_ADMIN' ? (
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
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>System</span>
                      )}
                    </td>

                    {/* Authority Column */}
                    <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '0.8rem', color: account.role === 'SUPER_ADMIN' ? 'var(--color-secondary)' : 'var(--text-secondary)', fontWeight: 600 }}>
                        {account.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
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

      {/* Create Admin Credentials Modal */}
      {createModalOpen && (
        <div className={styles.figmaModalOverlay}>
          <div className={styles.figmaModal} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
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

            <form onSubmit={handleCreateAdmin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Dummy hidden inputs to prevent browser autofill */}
              <input type="text" name="prevent_autofill_username" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  name="create_admin_fullname"
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={styles.figmaInput}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Email (Username)</label>
                <input 
                  type="email" 
                  required
                  autoComplete="new-email"
                  name="create_admin_email_field"
                  placeholder="e.g. john@gamesato.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={styles.figmaInput}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Password</label>
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
