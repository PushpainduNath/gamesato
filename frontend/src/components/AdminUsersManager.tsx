'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mail, Ban, ShieldAlert, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';
import styles from '../app/admin/page.module.css';

interface UserAccount {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  provider: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  is_blocked: boolean;
  created_at: string;
}

const renderProviderLogo = (provider: string | null) => {
  const p = provider?.toLowerCase();
  if (p === 'google') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255,255,255,0.05)' }} title="Google">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      </div>
    );
  }
  if (p === 'facebook') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(24, 119, 242, 0.1)', border: '1px solid rgba(24, 119, 242, 0.2)' }} title="Facebook">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </div>
    );
  }
  if (p === 'discord') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(88, 101, 242, 0.1)', border: '1px solid rgba(88, 101, 242, 0.2)' }} title="Discord">
        <svg viewBox="0 0 127.14 96.36" width="18" height="18" fill="#5865F2">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,73,0c.79.71,1.63,1.4,2.51,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129,54.65,122.54,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
        </svg>
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.05)' }} title="Credentials">
      <Mail size={14} style={{ color: 'var(--text-secondary)' }} />
    </div>
  );
};

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

const statusOptions: FilterSelectOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' }
];

const providerOptions: FilterSelectOption[] = [
  { value: 'all', label: 'All Platforms' },
  { value: 'credentials', label: 'Email / Password' },
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'discord', label: 'Discord' }
];

const sortOptions: FilterSelectOption[] = [
  { value: 'newest', label: 'Newest Registration' },
  { value: 'oldest', label: 'Oldest Registration' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'email_asc', label: 'Email (A-Z)' },
  { value: 'email_desc', label: 'Email (Z-A)' }
];

export default function AdminUsersManager() {
  const { admin, token, globalSearchQuery, setGlobalSearchQuery } = useAdminStore();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Custom Filtering & Sorting states
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const handleSort = (field: 'name' | 'email' | 'created_at') => {
    if (field === 'name') {
      setSortBy(prev => prev === 'name_asc' ? 'name_desc' : 'name_asc');
    } else if (field === 'email') {
      setSortBy(prev => prev === 'email_asc' ? 'email_desc' : 'email_asc');
    } else if (field === 'created_at') {
      setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest');
    }
    setCurrentPage(1);
  };
  
  const limit = 20;

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';

  // Fetch users with pagination and search query parameters
  const fetchUsers = async (page: number, search: string, status: string, provider: string, sort: string) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search.trim(),
        status,
        provider,
        sortBy: sort
      });

      const res = await fetch(`${backendUrl}/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalCount(data.pagination?.totalCount || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCurrentPage(data.pagination?.currentPage || 1);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch user list');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Search input debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(globalSearchQuery);
      setCurrentPage(1); // Reset page to 1 on search changes
    }, 400);
    return () => clearTimeout(timer);
  }, [globalSearchQuery]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, providerFilter, sortBy]);

  // Load user data on dependencies change
  useEffect(() => {
    fetchUsers(currentPage, debouncedSearch, statusFilter, providerFilter, sortBy);
  }, [currentPage, debouncedSearch, statusFilter, providerFilter, sortBy]);

  // Toast state
  const [toast, setToast] = useState<{ id: number; type: 'warning' | 'error' | 'success' | 'info'; title: string; message: string } | null>(null);

  const showToast = (message: string, type: 'warning' | 'error' | 'success' | 'info' = 'info', title?: string) => {
    const toastTitle = title || (type === 'warning' ? 'Notice' : type === 'error' ? 'Action Failed' : type === 'success' ? 'Success' : 'Notification');
    setToast({ id: Date.now(), type, title: toastTitle, message });
  };

  const handleToggleBlock = async (userId: string, currentBlockStatus: boolean) => {
    const newBlockStatus = !currentBlockStatus;

    setActionLoading(userId + '-block');
    try {
      const res = await fetch(`${backendUrl}/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_blocked: newBlockStatus }),
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: newBlockStatus } : u));
        showToast(`User ${newBlockStatus ? 'blocked' : 'unblocked'} successfully!`, 'success');
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

  // Helper to generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
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

  if (isInitialLoad && loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>Loading registered gamer accounts...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: 'var(--color-danger)' }}>
        <ShieldAlert size={40} />
        <h2 style={{ color: 'white' }}>User Console Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>
            User Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            View registered gamer accounts (role: USER) and manage their active/block status.
          </p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3 className={styles.chartTitle} style={{ border: 'none', padding: 0, margin: 0 }}>Registered Gamers Catalogue ({totalCount})</h3>
          <div className={styles.tableHeaderControls}>
            <div className={styles.tableSearchWrapper}>
              <Search size={15} className={styles.tableSearchIcon} />
              <input
                type="text"
                placeholder="Search name or email..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className={styles.tableSearchInput}
              />
            </div>
          </div>
        </div>

        {/* Filters and Sorting Row */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', padding: '0.85rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', alignItems: 'center' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status:</span>
            <CustomFilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              width="140px"
            />
          </div>

          {/* Platform Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Platform:</span>
            <CustomFilterSelect
              value={providerFilter}
              onChange={setProviderFilter}
              options={providerOptions}
              width="160px"
            />
          </div>

          {/* Sort Order Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sort By:</span>
            <CustomFilterSelect
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              width="190px"
            />
          </div>
        </div>

        <div className={styles.tableWrapper} style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer', userSelect: 'none', paddingLeft: '34px' }} onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Name</span>
                    {sortBy === 'name_asc' ? (
                      <ArrowUp size={14} />
                    ) : sortBy === 'name_desc' ? (
                      <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('email')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Email</span>
                    {sortBy === 'email_asc' ? (
                      <ArrowUp size={14} />
                    ) : sortBy === 'email_desc' ? (
                      <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                <th>Platform</th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('created_at')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Registered Date</span>
                    {sortBy === 'oldest' ? (
                      <ArrowUp size={14} />
                    ) : sortBy === 'newest' ? (
                      <ArrowDown size={14} />
                    ) : (
                      <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                </th>
                {isSuperAdmin && <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((account, index) => (
                  <tr key={account.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: '20px', textAlign: 'center', display: 'inline-block' }}>
                          {(currentPage - 1) * 10 + index + 1}
                        </span>
                        <img 
                          src={
                            account.image 
                              ? (account.image.startsWith('/uploads/') ? `${backendUrl}${account.image}` : account.image)
                              : '/defaultprofileicon.jpeg'
                          } 
                          alt={account.name || 'Gamer'} 
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/defaultprofileicon.jpeg';
                          }}
                        />
                        <div style={{ fontWeight: 600, color: 'var(--adm-text-primary, #ffffff)' }}>{account.name || 'Gamer'}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>
                        <Mail size={13} /> {account.email}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {renderProviderLogo(account.provider)}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>
                        {new Date(account.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                          <span style={{ fontSize: '0.8rem', color: account.is_blocked ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
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
                            title={account.is_blocked ? 'Unblock User' : 'Block User'}
                          >
                            <div className={styles.toggleKnob} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No registered gamers found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              Showing {Math.min((currentPage - 1) * limit + 1, totalCount)}-{Math.min(currentPage * limit, totalCount)} of {totalCount} gamers
            </div>
            <div className={styles.paginationPages}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
              >
                <ChevronLeft size={16} />
              </button>
              
              {getPageNumbers().map((pageNum, idx) => (
                <button
                  key={idx}
                  disabled={pageNum === '...' || loading}
                  onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                  className={`${styles.paginationBtn} ${currentPage === pageNum ? styles.paginationBtnActive : ''}`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
