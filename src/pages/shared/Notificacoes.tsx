import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import type { Database } from '../../types/database.types';

type Notificacao = Database['public']['Tables']['notificacoes']['Row'];

export const Notificacoes = () => {
  const { user, isAdmin } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotificacoes();

      const channel = supabase
        .channel('notificacoes-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notificacoes',
          },
          () => {
            loadNotificacoes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const loadNotificacoes = async () => {
    if (!user) return;

    try {
      const userId = isAdmin ? 'admin' : user.id;
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotificacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) throw error;
      loadNotificacoes();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!user) return;

    try {
      const userId = isAdmin ? 'admin' : user.id;
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', userId)
        .eq('lida', false);

      if (error) throw error;
      loadNotificacoes();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getIconByTipo = (tipo: string) => {
    switch (tipo) {
      case 'novo_pedido':
        return '🛒';
      case 'estoque_baixo':
        return '⚠️';
      case 'pedido_enviado':
        return '📦';
      case 'novo_produto':
        return '✨';
      default:
        return '🔔';
    }
  };

  const getTempoDecorrido = (data: string) => {
    const agora = new Date();
    const notifData = new Date(data);
    const diffMs = agora.getTime() - notifData.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    const diffDias = Math.floor(diffHoras / 24);
    return `${diffDias}d atrás`;
  };

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Notificações</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="animate-pulse h-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notificações</h1>
          <p className="text-gray-400 mt-1">
            {naoLidas > 0 ? `${naoLidas} notificação(ões) não lida(s)` : 'Todas lidas'}
          </p>
        </div>
        {naoLidas > 0 && (
          <Button variant="secondary" onClick={marcarTodasComoLidas}>
            <CheckCheck size={16} />
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      {notificacoes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg">Nenhuma notificação</p>
            <p className="text-gray-500 text-sm mt-2">
              Você será notificado sobre eventos importantes aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((notificacao) => (
            <Card
              key={notificacao.id}
              className={`${
                !notificacao.lida ? 'border-l-4 border-l-[#E11D48] bg-[#E11D48]/5' : ''
              }`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className="text-3xl">{getIconByTipo(notificacao.tipo)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        {notificacao.titulo}
                      </h3>
                      <p className="text-sm text-gray-400">{notificacao.mensagem}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {getTempoDecorrido(notificacao.created_at)}
                        </span>
                        {!notificacao.lida && (
                          <Badge variant="danger" className="text-xs">
                            Nova
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!notificacao.lida && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => marcarComoLida(notificacao.id)}
                      >
                        <CheckCheck size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
