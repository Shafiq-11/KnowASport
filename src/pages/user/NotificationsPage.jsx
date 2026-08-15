import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Ticket, CreditCard, Trophy, AlertCircle, Clock } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { SectionSkeleton } from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { notificationService } from '../../services/notificationService.js';
import SEOHead from '../../components/common/SEOHead.jsx';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    let active = true;

    async function loadNotifs() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await notificationService.getUserNotifications(user.id, { limit: 50 });
        if (active) setNotifications(data || []);
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifs();

    return () => {
      active = false;
    };
  }, [user]);

  const handleMarkAsRead = async (id) => {
    if (!user) return;
    await notificationService.markAsRead(id, user.id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      await handleMarkAsRead(n.id);
    }

    if (n.related_type === 'event' && n.related_id) {
      navigate(`/events/${n.related_id}`);
    } else if (n.related_type === 'registration') {
      navigate('/my-registrations');
    } else if (n.related_type === 'organizer') {
      navigate('/organizer/dashboard');
    }
  };

  const filteredNotifs = notifications.filter((n) => (filter === 'unread' ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderIcon = (type) => {
    switch (type) {
      case 'registration_confirmed':
        return <Ticket size={18} className="text-green-600" />;
      case 'payment_success':
        return <CreditCard size={18} className="text-amber-600" />;
      case 'organizer_approved':
      case 'event_approved':
        return <Trophy size={18} className="text-amber-500" />;
      case 'event_cancelled':
      case 'payment_failed':
        return <AlertCircle size={18} className="text-red-500" />;
      default:
        return <Bell size={18} className="text-neutral-500" />;
    }
  };

  return (
    <div className="kas-container py-8 lg:py-12 max-w-3xl space-y-8">
      <SEOHead title="Notifications | KnowASport" noindex={true} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={24} className="text-amber-500" />
            <h1 className="text-2xl sm:text-3xl font-800 text-neutral-900 tracking-tight">
              Activity Notifications
            </h1>
          </div>
          <p className="text-sm text-neutral-500">
            Important updates regarding your registrations, payments, and tournaments.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            icon={<CheckCheck size={16} />}
            className="text-xs font-700"
          >
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-700 transition-colors ${
              filter === 'all' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-700 transition-colors ${
              filter === 'unread' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {loading ? (
        <SectionSkeleton count={4} />
      ) : filteredNotifs.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifs.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-[14px] border transition-all cursor-pointer flex items-start gap-4 ${
                !n.read
                  ? 'bg-amber-50/60 border-amber-200 shadow-sm'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="w-10 h-10 rounded-[10px] bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {renderIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-800 text-neutral-900 text-sm flex items-center gap-2">
                    {n.title}
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    )}
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-500">
                    {new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">{n.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell size={36} className="text-neutral-400" />}
          title={filter === 'unread' ? 'No unread notifications' : "You're all caught up"}
          description={filter === 'unread' ? 'All your notifications have been marked as read.' : 'Important updates regarding registrations and tournaments will appear here.'}
        />
      )}
    </div>
  );
}
