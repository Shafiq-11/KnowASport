import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Plus, Edit3, Trash2, CheckCircle2, Clock, Sparkles, Eye } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { blogService } from '../../services/blogService.js';
import { formatDateShort } from '../../utils/formatters.js';

export default function AdminBlogPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    category: 'Tamil Nadu Sports',
    sport_name: 'All Sports',
    featured: false,
    status: 'published',
  });

  useEffect(() => {
    let active = true;

    async function loadArticles() {
      setLoading(true);
      try {
        const list = await blogService.getAllArticlesAdmin();
        if (active) setArticles(list || []);
      } catch (err) {
        console.error('Error loading admin blog articles:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArticles();

    return () => {
      active = false;
    };
  }, []);

  const openEditor = (article = null) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title || '',
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        cover_image: article.cover_image || '',
        category: article.category || 'Tamil Nadu Sports',
        sport_name: article.sport_name || 'All Sports',
        featured: Boolean(article.featured),
        status: article.status || 'published',
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800',
        category: 'Tamil Nadu Sports',
        sport_name: 'All Sports',
        featured: false,
        status: 'published',
      });
    }
    setShowEditor(true);
  };

  const handleTitleChange = (val) => {
    const derivedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingArticle ? prev.slug : derivedSlug,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        await blogService.updateArticle(editingArticle.id, formData, user);
        setArticles((prev) => prev.map((a) => (a.id === editingArticle.id ? { ...a, ...formData } : a)));
      } else {
        const created = await blogService.createArticle(formData, user);
        setArticles((prev) => [created, ...prev]);
      }
      setShowEditor(false);
    } catch (err) {
      console.error('Error saving article:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      await blogService.deleteArticle(id, user);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper size={22} className="text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              Sports Editorial & Blog Management
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Publish authentic Tamil Nadu sports news, tournament updates, and local athlete stories.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => openEditor(null)}
          icon={<Plus size={16} />}
          className="font-800"
        >
          Create New Article
        </Button>
      </div>

      {/* Articles Table */}
      {loading ? (
        <SectionSkeleton count={4} />
      ) : articles.length > 0 ? (
        <div className="bg-neutral-900 rounded-[16px] border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-700 uppercase tracking-wider text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Article Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-600">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-700 text-white">
                      <div className="flex items-center gap-2">
                        {art.featured && (
                          <span className="text-[10px] font-800 text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                            FEATURED
                          </span>
                        )}
                        <span className="line-clamp-1">{art.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">{art.category}</td>
                    <td className="py-3.5 px-4 text-neutral-400 capitalize">{art.sport_name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-800 uppercase ${
                        art.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {art.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">{formatDateShort(art.published_at || art.created_at)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditor(art)}
                          className="p-1.5 rounded-[6px] bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700"
                          title="Edit Article"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="p-1.5 rounded-[6px] bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          title="Delete Article"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="No editorial articles"
          description="Create your first sports news article or tournament story."
          action={() => openEditor(null)}
          actionLabel="Create Article"
        />
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-[20px] p-6 max-w-2xl w-full space-y-4 shadow-2xl my-8 text-white">
            <h3 className="font-800 text-lg border-b border-neutral-800 pb-3">
              {editingArticle ? 'Edit Editorial Article' : 'Create New Sports Article'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-700 text-neutral-400 block">Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 Tamil Nadu Football Tournaments You Should Know About"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-700 text-neutral-400 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Tamil Nadu Sports">Tamil Nadu Sports</option>
                    <option value="Local Events">Local Events</option>
                    <option value="Tournament Updates">Tournament Updates</option>
                    <option value="Athlete Stories">Athlete Stories</option>
                    <option value="Sports Tips">Sports Tips</option>
                    <option value="Community">Community</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-700 text-neutral-400 block">Sport Filter Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Football, Cricket, All Sports"
                    value={formData.sport_name}
                    onChange={(e) => setFormData({ ...formData, sport_name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-700 text-neutral-400 block">Cover Image URL</label>
                <input
                  type="text"
                  required
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-700 text-neutral-400 block">Short Excerpt / Subtitle</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Short summary displayed on cards and hero spotlight..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-700 text-neutral-400 block">Article Full Content</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Full editorial text content (paragraphs separated by double line breaks)..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-[8px] p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-[8px] bg-neutral-950 border border-neutral-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded border-neutral-800 focus:ring-amber-500"
                  />
                  <span className="font-700 text-white">Set as Featured Story on Blog Hero</span>
                </label>

                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="bg-neutral-900 border border-neutral-800 rounded-[6px] px-2.5 py-1 text-xs text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft (Private)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowEditor(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Article
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
