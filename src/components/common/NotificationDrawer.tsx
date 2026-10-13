import React from 'react';
import { db } from '../../services/db';
import { LMSNotification } from '../../types/lms';
import { Bell, Check, X, Clock, AlertTriangle, FileText, ShieldAlert } from 'lucide-react';

interface NotificationDrawerProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (link: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  userId,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [notifications, setNotifications] = React.useState<LMSNotification[]>([]);

  const refresh = () => {
    setNotifications(db.getNotifications(userId));
  };

  React.useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const markAllRead = () => {
    db.markAllNotificationsAsRead(userId);
    refresh();
  };

  const handleItemClick = (item: LMSNotification) => {
    db.markNotificationAsRead(item.id);
    refresh();
    if (item.link && onNavigate) {
      onNavigate(item.link);
      onClose();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'ASSESSMENT':
        return <FileText className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-neutral-700" />
            <h2 className="text-sm font-semibold text-neutral-900">Notifications</h2>
            <span className="text-xs text-neutral-700 font-mono">
              ({notifications.filter(n => !n.read).length} unread)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs">
              No notifications at this time.
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-4 text-left transition-colors cursor-pointer hover:bg-neutral-50 flex items-start gap-3 ${
                  !item.read ? 'bg-indigo-50/40' : ''
                }`}
              >
                {getCategoryIcon(item.category)}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${!item.read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                      {item.title}
                    </span>
                    <span className="text-xs text-neutral-700 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
