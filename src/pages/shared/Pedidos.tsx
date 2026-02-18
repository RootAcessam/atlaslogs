import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Clock, CheckCircle, Truck, X, MapPin } from 'lucide-react';
import type { Database } from '../../types/database.types';

type Pedido = Database['public']['Tables']['pedidos']['Row'];
type ItemPedido = Database['public']['Tables']['itens_pedido']['Row'];
type Produto = Database['public']['Tables']['produtos_estoque']['Row'];
type Lojista = Database['public']['Tables']['lojistas']['Row'];

interface PedidoCompleto extends Pedido {
  lojista?: Lojista;
  itens: (ItemPedido & { produto: Produto })[];
}

export const Pedidos = () => {
  const { user, isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<PedidoCompleto | null>(null);
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [transportadora, setTransportadora] = useState('');

  useEffect(() => {
    if (user) {
      loadPedidos();

      const channel = supabase
        .channel('pedidos-updates')
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
    }
  }, [user, isAdmin]);

  const loadPedidos = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('pedidos')
        .select(`
          *,
          lojista:lojistas(*),
          itens:itens_pedido(
            *,
            produto:produtos_estoque(*)
          )
        `)
        .order('data_criacao', { ascending: false });

      if (!isAdmin) {
        query = query.eq('lojista_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPedidos((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: 'success' | 'warning' | 'info' | 'danger'; label: string }> = {
      aguardando_separacao: { variant: 'warning', label: 'Aguardando Separação' },
      em_separacao: { variant: 'info', label: 'Em Separação' },
      embalado: { variant: 'info', label: 'Embalado' },
      enviado: { variant: 'success', label: 'Enviado' },
      cancelado: { variant: 'danger', label: 'Cancelado' },
    };

    const config = badges[status] || { variant: 'info', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const atualizarStatus = async (pedidoId: number, novoStatus: string) => {
    try {
      const updates: any = { status: novoStatus };

      if (novoStatus === 'em_separacao') {
        updates.data_separacao = new Date().toISOString();
      } else if (novoStatus === 'embalado') {
        updates.data_embalagem = new Date().toISOString();
      } else if (novoStatus === 'enviado') {
        updates.data_envio = new Date().toISOString();
        if (codigoRastreio) updates.codigo_rastreio = codigoRastreio;
        if (transportadora) updates.transportadora = transportadora;
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', pedidoId);

      if (error) throw error;

      await supabase.from('historico_pedido').insert({
        pedido_id: pedidoId,
        status_anterior: selectedPedido?.status || null,
        status_novo: novoStatus,
        observacao: `Status atualizado para ${novoStatus}`,
        responsavel: 'Sistema',
      });

      setModalOpen(false);
      setSelectedPedido(null);
      loadPedidos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const verDetalhes = (pedido: PedidoCompleto) => {
    setSelectedPedido(pedido);
    setCodigoRastreio(pedido.codigo_rastreio || '');
    setTransportadora(pedido.transportadora || '');
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Pedidos</h1>
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
      <div>
        <h1 className="text-3xl font-bold text-white">
          {isAdmin ? 'Todos os Pedidos' : 'Meus Pedidos'}
        </h1>
        <p className="text-gray-400 mt-1">{pedidos.length} pedido(s) encontrado(s)</p>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg">Nenhum pedido encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} hover onClick={() => verDetalhes(pedido)}>
              <CardContent className="flex items-center gap-4">
                <div className="p-3 bg-[#E11D48]/10 rounded-lg">
                  <Package className="text-[#E11D48]" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-semibold">Pedido #{pedido.id}</span>
                    {getStatusBadge(pedido.status)}
                    {isAdmin && pedido.lojista && (
                      <span className="text-sm text-gray-400">
                        {pedido.lojista.nome_fantasia}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{pedido.marketplace_origem}</span>
                    <span>•</span>
                    <span>{(pedido.dados_cliente as any)?.nome || 'Cliente'}</span>
                    <span>•</span>
                    <span>R$ {parseFloat(pedido.total_pedido.toString()).toFixed(2)}</span>
                    <span>•</span>
                    <span>
                      {new Date(pedido.data_criacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                {pedido.codigo_rastreio && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Rastreio</p>
                    <p className="text-sm text-[#E11D48] font-mono">
                      {pedido.codigo_rastreio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Pedido #${selectedPedido?.id}`}
        size="xl"
      >
        {selectedPedido && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {getStatusBadge(selectedPedido.status)}
              <span className="text-sm text-gray-400">
                Criado em {new Date(selectedPedido.data_criacao).toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardContent>
                  <h3 className="text-white font-semibold mb-3">Dados do Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-400">
                      Nome:{' '}
                      <span className="text-white">
                        {(selectedPedido.dados_cliente as any)?.nome}
                      </span>
                    </p>
                    <p className="text-gray-400">
                      Telefone:{' '}
                      <span className="text-white">
                        {(selectedPedido.dados_cliente as any)?.telefone}
                      </span>
                    </p>
                    <p className="text-gray-400">
                      Endereço:{' '}
                      <span className="text-white">
                        {(selectedPedido.dados_cliente as any)?.endereco},{' '}
                        {(selectedPedido.dados_cliente as any)?.numero}
                        <br />
                        {(selectedPedido.dados_cliente as any)?.bairro} -{' '}
                        {(selectedPedido.dados_cliente as any)?.cidade}/
                        {(selectedPedido.dados_cliente as any)?.estado}
                        <br />
                        CEP: {(selectedPedido.dados_cliente as any)?.cep}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h3 className="text-white font-semibold mb-3">Informações da Venda</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-400">
                      Marketplace:{' '}
                      <span className="text-white">{selectedPedido.marketplace_origem}</span>
                    </p>
                    {selectedPedido.numero_pedido_externo && (
                      <p className="text-gray-400">
                        Pedido Externo:{' '}
                        <span className="text-white">
                          {selectedPedido.numero_pedido_externo}
                        </span>
                      </p>
                    )}
                    <p className="text-gray-400">
                      Total:{' '}
                      <span className="text-white text-lg font-bold">
                        R$ {parseFloat(selectedPedido.total_pedido.toString()).toFixed(2)}
                      </span>
                    </p>
                    {selectedPedido.codigo_rastreio && (
                      <>
                        <p className="text-gray-400">
                          Rastreio:{' '}
                          <span className="text-[#E11D48] font-mono">
                            {selectedPedido.codigo_rastreio}
                          </span>
                        </p>
                        <p className="text-gray-400">
                          Transportadora:{' '}
                          <span className="text-white">{selectedPedido.transportadora}</span>
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent>
                <h3 className="text-white font-semibold mb-3">Produtos</h3>
                <div className="space-y-2">
                  {selectedPedido.itens?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg"
                    >
                      <Package size={16} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                          {item.produto?.nome}
                        </p>
                        <p className="text-xs text-gray-500">SKU: {item.produto?.sku}</p>
                      </div>
                      {item.produto?.localizacao && (
                        <div className="flex items-center gap-1 text-[#E11D48] text-xs">
                          <MapPin size={12} />
                          <span>{item.produto.localizacao}</span>
                        </div>
                      )}
                      <Badge variant="info">Qtd: {item.quantidade}</Badge>
                      <span className="text-sm text-white">
                        R$ {parseFloat(item.preco_unitario.toString()).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isAdmin && selectedPedido.status !== 'enviado' && (
              <div className="flex gap-3 justify-end border-t border-[#1F1F1F] pt-4">
                {selectedPedido.status === 'aguardando_separacao' && (
                  <Button
                    variant="primary"
                    onClick={() => atualizarStatus(selectedPedido.id, 'em_separacao')}
                  >
                    <Clock size={16} />
                    Iniciar Separação
                  </Button>
                )}
                {selectedPedido.status === 'em_separacao' && (
                  <Button
                    variant="primary"
                    onClick={() => atualizarStatus(selectedPedido.id, 'embalado')}
                  >
                    <CheckCircle size={16} />
                    Marcar como Embalado
                  </Button>
                )}
                {selectedPedido.status === 'embalado' && (
                  <div className="flex gap-3 flex-1">
                    <Input
                      placeholder="Código de rastreio"
                      value={codigoRastreio}
                      onChange={(e) => setCodigoRastreio(e.target.value)}
                    />
                    <Input
                      placeholder="Transportadora"
                      value={transportadora}
                      onChange={(e) => setTransportadora(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      onClick={() => atualizarStatus(selectedPedido.id, 'enviado')}
                    >
                      <Truck size={16} />
                      Confirmar Envio
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
