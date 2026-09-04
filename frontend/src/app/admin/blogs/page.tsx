'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { 
  FileText, Plus, Search, Edit3, Trash2, CheckCircle2, AlertCircle, 
  Eye, X, ArrowLeft, Image as ImageIcon, Calendar, Tag, User,
  ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, Sparkles
} from 'lucide-react';
import CustomDialogModal, { DialogState } from '@/components/CustomDialogModal';
import styles from '../page.module.css';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author: string;
  status: 'published' | 'draft';
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at?: string;
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

const CustomFilterSelect: React.FC<CustomFilterSelectProps> = ({ value, onChange, options, width = '160px' }) => {
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

  const activeOption = options.find(opt => opt.value.toLowerCase() === value.toLowerCase()) || options[0] || { value, label: value };

  return (
    <div ref={dropdownRef} className={styles.customSelectContainer} style={{ width }}>
      <div 
        className={styles.customSelectTrigger} 
        onClick={() => setIsOpen(!isOpen)}
        style={{ height: '34px', padding: '0 10px', borderRadius: '8px' }}
      >
        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
          {activeOption.label}
        </span>
        <ChevronDown size={14} className={`${styles.selectArrow} ${isOpen ? styles.selectArrowOpen : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.customSelectDropdown} style={{ top: 'calc(100% + 4px)', zIndex: 100 }}>
          <div className={styles.customSelectOptionsList} style={{ maxHeight: '240px' }}>
            {options.map((opt) => (
              <div 
                key={opt.value} 
                className={`${styles.customSelectOption} ${value.toLowerCase() === opt.value.toLowerCase() ? styles.customSelectOptionActive : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{ padding: '7px 10px', fontSize: '0.8rem' }}
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

export default function AdminBlogsPage() {
  const { token, globalSearchQuery, setGlobalSearchQuery } = useAdminStore();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false });

  // Column Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [sortField, setSortField] = useState<'created_at' | 'title' | 'category' | 'author' | 'status'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationEnabled, setPaginationEnabled] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('General');
  const [author, setAuthor] = useState('Gamesato Editorial');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3102';

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/blogs/admin/list?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.blogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBlogs();
    }
  }, [token]);

  // Sync global search with local query
  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
      setCurrentPage(1);
    }
  }, [globalSearchQuery]);

  // Extract unique categories and authors for filter options
  const categoryOptions: FilterSelectOption[] = useMemo(() => {
    const cats = new Set<string>();
    blogs.forEach(b => {
      if (b.category) cats.add(b.category);
    });
    return [
      { value: 'all', label: 'All Categories' },
      ...Array.from(cats).sort().map(c => ({ value: c, label: c }))
    ];
  }, [blogs]);

  const authorOptions: FilterSelectOption[] = useMemo(() => {
    const authors = new Set<string>();
    blogs.forEach(b => {
      if (b.author) authors.add(b.author);
    });
    return [
      { value: 'all', label: 'All Authors' },
      ...Array.from(authors).sort().map(a => ({ value: a, label: a }))
    ];
  }, [blogs]);

  const statusOptions: FilterSelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' }
  ];

  const itemsPerPageOptions: FilterSelectOption[] = [
    { value: '10', label: '10 / page' },
    { value: '20', label: '20 / page' },
    { value: '50', label: '50 / page' },
    { value: '100', label: '100 / page' }
  ];

  // Sorting Handler
  const handleSort = (field: 'created_at' | 'title' | 'category' | 'author' | 'status') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'created_at' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Filter & Sort Pipeline
  const filteredAndSortedBlogs = useMemo(() => {
    return blogs.filter((b) => {
      // Search text match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        b.title.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
        b.slug.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 'all' && b.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && b.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }

      // Author filter
      if (selectedAuthor !== 'all' && (b.author || '').toLowerCase() !== selectedAuthor.toLowerCase()) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'created_at') {
        const dateA = new Date(aVal).getTime();
        const dateB = new Date(bVal).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [blogs, searchQuery, selectedCategory, selectedStatus, selectedAuthor, sortField, sortDirection]);

  // Pagination calculations
  const totalItems = filteredAndSortedBlogs.length;
  const totalPages = paginationEnabled ? Math.max(1, Math.ceil(totalItems / itemsPerPage)) : 1;
  const paginatedBlogs = paginationEnabled 
    ? filteredAndSortedBlogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredAndSortedBlogs;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setGlobalSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedAuthor('all');
    setSortField('created_at');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedAuthor !== 'all';

  // Slug generator helper
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!editingBlog) {
      const generatedSlug = newTitle
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBlog(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCoverImage('');
    setCategory('General');
    setAuthor('Gamesato Editorial');
    setStatus('published');
    setMetaTitle('');
    setMetaDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setExcerpt(blog.excerpt || '');
    setContent(blog.content);
    setCoverImage(blog.cover_image || '');
    setCategory(blog.category || 'General');
    setAuthor(blog.author || 'Gamesato Editorial');
    setStatus(blog.status || 'published');
    setMetaTitle(blog.meta_title || '');
    setMetaDescription(blog.meta_description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setDialogState({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Title and Article Content are required.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = editingBlog 
        ? `${backendUrl}/api/blogs/admin/${editingBlog.id}`
        : `${backendUrl}/api/blogs/admin/create`;

      const method = editingBlog ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt,
          content,
          cover_image: coverImage,
          category,
          author,
          status,
          meta_title: metaTitle,
          meta_description: metaDescription,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchBlogs();
        setDialogState({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: editingBlog ? 'Blog post updated successfully!' : 'Blog post created successfully!',
        });
      } else {
        setDialogState({
          isOpen: true,
          type: 'danger',
          title: 'Error',
          message: data.message || 'Operation failed.',
        });
      }
    } catch (err) {
      console.error(err);
      setDialogState({
        isOpen: true,
        type: 'danger',
        title: 'Network Error',
        message: 'Failed to communicate with the server.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, blogTitle: string) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Blog Post',
      message: `Are you sure you want to permanently delete "${blogTitle}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await fetch(`${backendUrl}/api/blogs/admin/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            fetchBlogs();
            setDialogState({
              isOpen: true,
              type: 'success',
              title: 'Deleted',
              message: 'Blog article removed successfully.',
            });
          } else {
            setDialogState({
              isOpen: true,
              type: 'danger',
              title: 'Failed',
              message: 'Could not delete blog post.',
            });
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const renderSortIcon = (field: 'created_at' | 'title' | 'category' | 'author' | 'status') => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} style={{ opacity: 0.4, marginLeft: '4px', verticalAlign: 'middle' }} />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={13} style={{ color: 'var(--adm-accent, #2dd4bf)', marginLeft: '4px', verticalAlign: 'middle' }} />
      : <ArrowDown size={13} style={{ color: 'var(--adm-accent, #2dd4bf)', marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '0.85rem' }}>
      <CustomDialogModal {...dialogState} onClose={() => setDialogState({ isOpen: false })} />

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, color: 'var(--adm-text-primary, #ffffff)' }}>
            <FileText color="var(--adm-accent, #14b8a6)" size={22} /> Blog Management
          </h1>
          <p style={{ color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
            Create, edit, publish, and manage rich editorial content & articles for Gamesato.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
            color: '#051817',
            border: 'none',
            padding: '0.5rem 1.1rem',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 14px rgba(20, 184, 166, 0.25)',
            transition: 'transform 0.15s ease',
          }}
        >
          <Plus size={16} /> Create New Post
        </button>
      </div>

      {/* Filters & Search Control Bar */}
      <div className={styles.filtersBar} style={{ padding: '0.6rem 0.85rem', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text-secondary, #94a3b8)' }} />
          <input
            type="text"
            placeholder="Search articles by title, category, author..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setGlobalSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              background: 'var(--adm-input-bg, #0d1117)',
              border: '1px solid var(--adm-border, rgba(255, 255, 255, 0.1))',
              borderRadius: '8px',
              color: 'var(--adm-text-primary, #ffffff)',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setGlobalSearchQuery('');
                setCurrentPage(1);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <CustomFilterSelect
          value={selectedCategory}
          onChange={(val) => {
            setSelectedCategory(val);
            setCurrentPage(1);
          }}
          options={categoryOptions}
          width="150px"
        />

        {/* Status Filter */}
        <CustomFilterSelect
          value={selectedStatus}
          onChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
          options={statusOptions}
          width="130px"
        />

        {/* Author Filter */}
        <CustomFilterSelect
          value={selectedAuthor}
          onChange={(val) => {
            setSelectedAuthor(val);
            setCurrentPage(1);
          }}
          options={authorOptions}
          width="150px"
        />

        {/* Per Page Select */}
        <CustomFilterSelect
          value={String(itemsPerPage)}
          onChange={(val) => {
            setItemsPerPage(Number(val));
            setCurrentPage(1);
          }}
          options={itemsPerPageOptions}
          width="110px"
        />

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.4rem 0.75rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Main Table Card (Scrolling + Contained Layout) */}
      <div className={styles.tableCard} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <div className={styles.tableWrapper} style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>
              Loading articles...
            </div>
          ) : paginatedBlogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>
              <FileText size={42} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--adm-text-primary, #ffffff)', fontSize: '1.1rem' }}>
                No Blog Posts Found
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {hasActiveFilters ? 'Try adjusting or clearing your search and filters.' : 'Click "+ Create New Post" to publish your first article!'}
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th onClick={() => handleSort('title')} style={{ cursor: 'pointer', minWidth: '260px' }}>
                    Article Title {renderSortIcon('title')}
                  </th>
                  <th onClick={() => handleSort('category')} style={{ cursor: 'pointer', minWidth: '120px' }}>
                    Category {renderSortIcon('category')}
                  </th>
                  <th onClick={() => handleSort('author')} style={{ cursor: 'pointer', minWidth: '140px' }}>
                    Author {renderSortIcon('author')}
                  </th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', minWidth: '110px' }}>
                    Status {renderSortIcon('status')}
                  </th>
                  <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer', minWidth: '110px' }}>
                    Date {renderSortIcon('created_at')}
                  </th>
                  <th style={{ width: '120px', textAlign: 'right', paddingRight: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBlogs.map((b, index) => {
                  const displayIndex = paginationEnabled 
                    ? (currentPage - 1) * itemsPerPage + index + 1 
                    : index + 1;

                  return (
                    <tr key={b.id}>
                      <td style={{ textAlign: 'center', color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.8rem', fontWeight: 600 }}>
                        {displayIndex}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.88rem' }}>
                            {b.title}
                          </span>
                          {b.excerpt && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-secondary, #94a3b8)', maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {b.excerpt}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: 'rgba(20, 184, 166, 0.12)',
                          color: 'var(--adm-accent, #2dd4bf)',
                          border: '1px solid rgba(20, 184, 166, 0.25)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '50px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          {b.category || 'General'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.82rem' }}>
                          <User size={13} style={{ opacity: 0.6 }} />
                          <span style={{ whiteSpace: 'nowrap' }}>{b.author || 'Gamesato Editorial'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: b.status === 'published' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                          color: b.status === 'published' ? '#4ade80' : '#facc15',
                          border: b.status === 'published' ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(234, 179, 8, 0.25)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '50px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          display: 'inline-block'
                        }}>
                          {b.status || 'published'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--adm-text-secondary, #94a3b8)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <a 
                            href={`/blog/${b.slug}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              background: 'var(--adm-button-bg, rgba(255,255,255,0.05))', 
                              border: '1px solid var(--adm-border, rgba(255,255,255,0.08))', 
                              color: 'var(--adm-text-secondary, #94a3b8)', 
                              padding: '0.35rem', 
                              borderRadius: '6px', 
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none'
                            }} 
                            title="View Public Post"
                          >
                            <Eye size={15} />
                          </a>
                          <button 
                            onClick={() => handleOpenEditModal(b)} 
                            style={{ 
                              background: 'rgba(20, 184, 166, 0.12)', 
                              border: '1px solid rgba(20, 184, 166, 0.25)', 
                              color: 'var(--adm-accent, #2dd4bf)', 
                              padding: '0.35rem', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }} 
                            title="Edit Article"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(b.id, b.title)} 
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.12)', 
                              border: '1px solid rgba(239, 68, 68, 0.25)', 
                              color: '#f87171', 
                              padding: '0.35rem', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }} 
                            title="Delete Article"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer} style={{ marginTop: 'auto', borderTop: '1px solid var(--adm-border, rgba(255,255,255,0.06))', padding: '0.75rem 0' }}>
            <div className={styles.paginationInfo}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} articles
            </div>
            <div className={styles.paginationPages}>
              <button
                type="button"
                className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={15} />
              </button>
              {getPageNumbers().map((pageNum, idx) => (
                typeof pageNum === 'number' ? (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.paginationBtn} ${currentPage === pageNum ? styles.paginationBtnActive : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ) : (
                  <span key={idx} style={{ padding: '0 5px', color: 'var(--adm-text-secondary, #94a3b8)', alignSelf: 'center', fontSize: '0.8rem', userSelect: 'none' }}>
                    {pageNum}
                  </span>
                )
              ))}
              <button
                type="button"
                className={`${styles.paginationBtn} ${styles.paginationArrowBtn}`}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--adm-modal-bg, #0d1117)', border: '1px solid var(--adm-border, rgba(255,255,255,0.12))',
            borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '90vh',
            overflowY: 'auto', padding: '1.75rem', color: 'var(--adm-text-primary, #ffffff)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--adm-border, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--adm-text-primary, #ffffff)' }}>
                  {editingBlog ? 'Edit Blog Article' : 'Create New Article'}
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>
                  {editingBlog ? 'Update article details, media, and HTML body.' : 'Publish a new editorial article to the Gamesato Blog.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ 
                  background: 'var(--adm-button-bg, rgba(255,255,255,0.05))', 
                  border: '1px solid var(--adm-border, rgba(255,255,255,0.1))', 
                  color: 'var(--adm-text-secondary, #94a3b8)', 
                  cursor: 'pointer',
                  borderRadius: '8px',
                  padding: '5px',
                  display: 'flex'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Top 10 HTML5 Arcade Games to Play in 2026"
                  style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Slug (URL Name)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="top-10-html5-arcade-games"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Guides, News, Reviews, Arcade"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem' }}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Cover Image URL</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://gamesato.com/uploads/blog_1_cover.jpg or /uploads/..."
                  style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Short Excerpt</label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A brief summary for blog preview cards and search engines..."
                  style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Article Content (HTML/Rich Text) *</label>
                <textarea
                  rows={9}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Write your article HTML content here...</p>"
                  style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Meta Title (SEO)</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Custom SEO Title"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--adm-text-secondary, #94a3b8)' }}>Meta Description (SEO)</label>
                  <input
                    type="text"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Custom SEO Description"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--adm-input-bg, #051817)', border: '1px solid var(--adm-border, rgba(20, 184, 166, 0.3))', borderRadius: '8px', color: 'var(--adm-text-primary, #ffffff)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid var(--adm-border, rgba(255,255,255,0.12))', color: 'var(--adm-text-secondary, #94a3b8)', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)', color: '#051817', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {submitting ? 'Saving...' : editingBlog ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
