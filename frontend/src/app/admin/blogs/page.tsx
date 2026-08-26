'use client';

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { 
  FileText, Plus, Search, Edit3, Trash2, CheckCircle2, AlertCircle, 
  Eye, X, ArrowLeft, Image as ImageIcon, Calendar, Tag, User 
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
}

export default function AdminBlogsPage() {
  const { token } = useAdminStore();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false });

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
  const [author, setAuthor] = useState('Gamesato Team');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3102';

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/blogs/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const handleOpenCreateModal = () => {
    setEditingBlog(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCoverImage('');
    setCategory('General');
    setAuthor('Gamesato Team');
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
    setAuthor(blog.author || 'Gamesato Team');
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
        message: 'Title and Content are required.',
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
          slug,
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, blogTitle: string) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Blog Post',
      message: `Are you sure you want to delete "${blogTitle}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${backendUrl}/api/blogs/admin/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            fetchBlogs();
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', color: 'white' }}>
      <CustomDialogModal {...dialogState} onClose={() => setDialogState({ isOpen: false })} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText color="#14b8a6" size={28} /> Blog Manager
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Create, edit, publish, and manage Gamesato blog articles and guides.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
            color: '#051817',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(20, 184, 166, 0.3)',
          }}
        >
          <Plus size={18} /> Add New Article
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '360px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.55rem 0.75rem 0.55rem 2.25rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '0.85rem',
          }}
        />
      </div>

      {/* Blogs Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading articles...</div>
      ) : filteredBlogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <FileText size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3>No Blog Posts Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Click "Add New Article" to publish your first blog post!</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                <th style={{ padding: '1rem' }}>Article Title</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem' }}>Author</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>{b.title}</td>
                  <td style={{ padding: '1rem' }}><span style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '700' }}>{b.category}</span></td>
                  <td style={{ padding: '1rem', color: '#94a3b8' }}>{b.author}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      background: b.status === 'published' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: b.status === 'published' ? '#4ade80' : '#facc15',
                      padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#94a3b8' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <a href={`/blog/${b.slug}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} title="View">
                        <Eye size={16} />
                      </a>
                      <button onClick={() => handleOpenEditModal(b)} style={{ background: 'rgba(20, 184, 166, 0.15)', border: 'none', color: '#2dd4bf', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(b.id, b.title)} style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#f87171', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', width: '100%', maxWidth: '750px', maxHeight: '90vh',
            overflowY: 'auto', padding: '2rem', color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }}>
                {editingBlog ? 'Edit Blog Article' : 'Create New Article'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Top 10 HTML5 Arcade Games to Play in 2026"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#051817', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Slug (URL Name)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="top-10-html5-arcade-games"
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#051817', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Guides, News, Reviews"
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#051817', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#051817', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#051817', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', color: 'white' }}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Cover Image URL</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://gamesato.com/uploads/blog-banner.jpg"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#051817', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Short Excerpt</label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A brief summary for cards and search snippets..."
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#051817', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem' }}>Article Content (HTML/Text) *</label>
                <textarea
                  rows={8}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Write your article HTML content here...</p>"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#051817', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '8px', color: 'white', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)', color: '#051817', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
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
