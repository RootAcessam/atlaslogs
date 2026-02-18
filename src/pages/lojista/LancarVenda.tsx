import { useEffect, useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X, ShoppingCart, Package } from 'lucide-react';
import type { Database } from '../../types/database.types';

type Produto = Database['public']['Tables']['produtos_estoque']['Row'];

interface ItemVenda {
  produto: Produto;
  quantidade: number;
  preco_unitario: number;
}

export const LancarVenda = () => {
  const { user, lojista } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [loading, setLoading] = useState(false);

  const [produtoSelecionado, setProdutoSelecionado] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState('');

  const [dadosCliente, setDadosCliente] = useState({
    nome: '',
    cpf_cnpj: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const [dadosVenda, setDadosVenda] = useState({
    numero_pedido_externo: '',
    marketplace_origem: 'Mercado Livre',
  });

  useEffect(() => {
    if (user) {
      loadProdutos();
    }
  }, [user]);

  const loadProdutos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('produtos_estoque')
        .select('*')
        .eq('lojista_id', user.id)
        .eq('status', 'ativo')
        .gt('quantidade_atual', 0)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const adicionarItem = () => {
    if (!produtoSelecionado || !precoUnitario) return;

    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    if (quantidade > produto.quantidade_atual) {
      alert('Quantidade maior que o estoque disponível!');
      return;
    }

    setItens([
      ...itens,
      {
        produto,
        quantidade,
        preco_unitario: parseFloat(precoUnitario),
      },
    ]);

    setProdutoSelecionado(null);
    setQuantidade(1);
    setPrecoUnitario('');
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !lojista || itens.length === 0) return;

    setLoading(true);

    try {
      const total = calcularTotal();
      const comissao = (total * lojista.comissao_percentual) / 100;

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          lojista_id: user.id,
          numero_pedido_externo: dadosVenda.numero_pedido_externo,
          marketplace_origem: dadosVenda.marketplace_origem,
          status: 'aguardando_separacao',
          dados_cliente: dadosCliente,
          total_pedido: total,
          comissao_calculada: comissao,
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      for (const item of itens) {
        const { error: itemError } = await supabase.from('itens_pedido').insert({
          pedido_id: pedido.id,
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
        });

        if (itemError) throw itemError;

        const novaQuantidade = item.produto.quantidade_atual - item.quantidade;
        const { error: estoqueError } = await supabase
          .from('produtos_estoque')
          .update({ quantidade_atual: novaQuantidade })
          .eq('id', item.produto.id);

        if (estoqueError) throw estoqueError;

        const { error: movError } = await supabase
          .from('movimentacoes_estoque')
          .insert({
            produto_id: item.produto.id,
            tipo: 'saida',
            quantidade: item.quantidade,
            motivo: 'venda',
            pedido_id: pedido.id,
            observacao: `Venda #${pedido.id}`,
          });

        if (movError) throw movError;
      }

      const { error: historicoError } = await supabase
        .from('historico_pedido')
        .insert({
          pedido_id: pedido.id,
          status_anterior: null,
          status_novo: 'aguardando_separacao',
          observacao: 'Pedido criado',
          responsavel: lojista.nome_fantasia,
        });

      if (historicoError) throw historicoError;

      await supabase.from('notificacoes').insert({
        usuario_id: 'admin',
        tipo: 'novo_pedido',
        titulo: 'Nova Venda Lançada',
        mensagem: `${lojista.nome_fantasia} lançou um novo pedido de R$ ${total.toFixed(2)}`,
        link: `/admin/pedidos/${pedido.id}`,
      });

      alert('Venda lançada com sucesso!');
      setItens([]);
      setDadosCliente({
        nome: '',
        cpf_cnpj: '',
        telefone: '',
        email: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
      });
      setDadosVenda({
        numero_pedido_externo: '',
        marketplace_origem: 'Mercado Livre',
      });
      loadProdutos();
    } catch (error) {
      console.error('Erro ao lançar venda:', error);
      alert('Erro ao lançar venda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Lançar Nova Venda</h1>
        <p className="text-gray-400 mt-1">
          Registre uma venda realizada em marketplace externo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Número do Pedido Externo"
                value={dadosVenda.numero_pedido_externo}
                onChange={(e) =>
                  setDadosVenda({ ...dadosVenda, numero_pedido_externo: e.target.value })
                }
                placeholder="Ex: 123456789"
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Marketplace *
                </label>
                <select
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg text-white focus:outline-none focus:border-[#E11D48] transition-colors"
                  value={dadosVenda.marketplace_origem}
                  onChange={(e) =>
                    setDadosVenda({ ...dadosVenda, marketplace_origem: e.target.value })
                  }
                  required
                >
                  <option value="Mercado Livre">Mercado Livre</option>
                  <option value="Shopee">Shopee</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Magalu">Magalu</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Produto
                </label>
                <select
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg text-white focus:outline-none focus:border-[#E11D48] transition-colors"
                  value={produtoSelecionado || ''}
                  onChange={(e) => setProdutoSelecionado(Number(e.target.value))}
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} - Estoque: {produto.quantidade_atual}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Quantidade"
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-24"
              />
              <Input
                label="Preço (R$)"
                type="number"
                step="0.01"
                min="0"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(e.target.value)}
                className="w-32"
              />
              <div className="flex items-end">
                <Button type="button" variant="secondary" onClick={adicionarItem}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {itens.length > 0 && (
              <div className="mt-4 space-y-2">
                {itens.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg"
                  >
                    <Package size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{item.produto.nome}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantidade}x R$ {item.preco_unitario.toFixed(2)} = R${' '}
                        {(item.quantidade * item.preco_unitario).toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className="p-1 hover:bg-[#1F1F1F] rounded text-gray-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-[#1F1F1F]">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-2xl font-bold text-[#E11D48]">
                    R$ {calcularTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome Completo *"
              value={dadosCliente.nome}
              onChange={(e) => setDadosCliente({ ...dadosCliente, nome: e.target.value })}
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="CPF/CNPJ"
                value={dadosCliente.cpf_cnpj}
                onChange={(e) => setDadosCliente({ ...dadosCliente, cpf_cnpj: e.target.value })}
              />
              <Input
                label="Telefone *"
                value={dadosCliente.telefone}
                onChange={(e) => setDadosCliente({ ...dadosCliente, telefone: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={dadosCliente.email}
                onChange={(e) => setDadosCliente({ ...dadosCliente, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Input
                label="CEP *"
                value={dadosCliente.cep}
                onChange={(e) => setDadosCliente({ ...dadosCliente, cep: e.target.value })}
                required
              />
              <Input
                label="Número *"
                value={dadosCliente.numero}
                onChange={(e) => setDadosCliente({ ...dadosCliente, numero: e.target.value })}
                required
                className="col-span-1"
              />
              <Input
                label="Complemento"
                value={dadosCliente.complemento}
                onChange={(e) =>
                  setDadosCliente({ ...dadosCliente, complemento: e.target.value })
                }
                className="col-span-2"
              />
            </div>

            <Input
              label="Endereço *"
              value={dadosCliente.endereco}
              onChange={(e) => setDadosCliente({ ...dadosCliente, endereco: e.target.value })}
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Bairro *"
                value={dadosCliente.bairro}
                onChange={(e) => setDadosCliente({ ...dadosCliente, bairro: e.target.value })}
                required
              />
              <Input
                label="Cidade *"
                value={dadosCliente.cidade}
                onChange={(e) => setDadosCliente({ ...dadosCliente, cidade: e.target.value })}
                required
              />
              <Input
                label="Estado *"
                value={dadosCliente.estado}
                onChange={(e) => setDadosCliente({ ...dadosCliente, estado: e.target.value })}
                maxLength={2}
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={itens.length === 0}
          >
            <ShoppingCart size={20} />
            Lançar Venda
          </Button>
        </div>
      </form>
    </div>
  );
};
