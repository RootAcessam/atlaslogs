import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Layout = ({ children, currentPath, onNavigate }: LayoutProps) => {
  const { toasts, removeToast } = useToast();
  const { user, isAdmin } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadNotificationCount = async () => {
      const userId = isAdmin ? 'admin' : user.id;
      const { count } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', userId)
        .eq('lida', false);

      setNotificationCount(count || 0);
    };

    loadNotificationCount();

    const channel = supabase
      .channel('notificacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
        },
        () => {
          loadNotificationCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        notificationCount={notificationCount}
      />
      <div className="ml-64 p-8">
        {children}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};
