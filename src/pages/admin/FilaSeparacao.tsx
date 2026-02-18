import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { Clock, Package, MapPin, Play } from 'lucide-react';
import type { Database } from '../../types/database.types';

type Pedido = Database['public']['Tables']['pedidos']['Row'];
type ItemPedido = Database['public']['Tables']['itens_pedido']['Row'];
type Produto = Database['public']['Tables']['produtos_estoque']['Row'];
type Lojista = Database['public']['Tables']['lojistas']['Row'];

interface PedidoCompleto extends Pedido {
  lojista: Lojista;
  itens: (ItemPedido & { produto: Produto })[];
}

export const FilaSeparacao = () => {
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPedidos();

    const channel = supabase
      .channel('pedidos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
        },
        () => {
          loadPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPedidos = async () => {
    try {
      const { data: pedidosData, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          lojista:lojistas(*),
          itens:itens_pedido(
            *,
            produto:produtos_estoque(*)
          )
        `)
        .eq('status', 'aguardando_separacao')
        .order('data_criacao', { ascending: true });

      if (error) throw error;
      setPedidos((pedidosData as any) || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarSeparacao = async (pedidoId: number) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'em_separacao',
          data_separacao: new Date().toISOString(),
        })
        .eq('id', pedidoId);

      if (error) throw error;

      await supabase.from('historico_pedido').insert({
        pedido_id: pedidoId,
        status_anterior: 'aguardando_separacao',
        status_novo: 'em_separacao',
        observacao: 'Separação iniciada',
        responsavel: 'Admin',
      });

      loadPedidos();
    } catch (error) {
      console.error('Erro ao iniciar separação:', error);
    }
  };

  const getTempoEspera = (dataCriacao: string) => {
    const criacao = new Date(dataCriacao);
    const agora = new Date();
    const diffMs = agora.getTime() - criacao.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}min`;
    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `${diffHoras}h`;
    return `${Math.floor(diffHoras / 24)}d`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Fila de Separação</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="animate-pulse h-32" />
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
          <h1 className="text-3xl font-bold text-white">Fila de Separação</h1>
          <p className="text-gray-400 mt-1">
            {pedidos.length} pedido(s) aguardando separação
          </p>
        </div>
        <Badge variant={pedidos.length > 0 ? 'warning' : 'success'}>
          {pedidos.length > 0 ? 'Pedidos Pendentes' : 'Fila Vazia'}
        </Badge>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg">Nenhum pedido aguardando separação</p>
            <p className="text-gray-500 text-sm mt-2">
              Novos pedidos aparecerão aqui automaticamente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="border-l-4 border-l-[#E11D48]">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="warning">#{pedido.id}</Badge>
                      <span className="text-white font-semibold">
                        {pedido.lojista?.nome_fantasia || 'Lojista'}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {pedido.marketplace_origem}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Clock size={14} />
                        <span>{getTempoEspera(pedido.data_criacao)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="text-sm text-white">
                          {(pedido.dados_cliente as any)?.nome || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pedido Externo</p>
                        <p className="text-sm text-white">
                          {pedido.numero_pedido_externo || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-2">Produtos para Separar</p>
                      <div className="space-y-2">
                        {pedido.itens?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 bg-[#0A0A0A] rounded-lg"
                          >
                            <Package size={16} className="text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm text-white">
                                {item.produto?.nome || 'Produto'}
                              </p>
                              <p className="text-xs text-gray-500">
                                SKU: {item.produto?.sku}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="info">Qtd: {item.quantidade}</Badge>
                              {item.produto?.localizacao && (
                                <div className="flex items-center gap-1 text-[#E11D48] text-xs">
                                  <MapPin size={12} />
                                  <span>{item.produto.localizacao}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => iniciarSeparacao(pedido.id)}
                  >
                    <Play size={20} />
                    Iniciar Separação
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
