import { useEffect, useState, FormEvent } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Package, MapPin, TrendingDown, TrendingUp } from 'lucide-react';
import type { Database } from '../../types/database.types';

type Produto = Database['public']['Tables']['produtos_estoque']['Row'];

export const MeusProdutos = () => {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [movimentacaoModalOpen, setMovimentacaoModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    categoria: '',
    descricao: '',
    peso_gramas: '',
    imagem_url: '',
    quantidade_atual: '0',
    quantidade_minima: '1',
  });

  const [movimentacao, setMovimentacao] = useState({
    tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantidade: '',
    motivo: '',
    observacao: '',
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({
        nome: produto.nome,
        sku: produto.sku,
        categoria: produto.categoria || '',
        descricao: produto.descricao || '',
        peso_gramas: produto.peso_gramas?.toString() || '',
        imagem_url: produto.imagem_url || '',
        quantidade_atual: produto.quantidade_atual.toString(),
        quantidade_minima: produto.quantidade_minima.toString(),
      });
    } else {
      setEditingProduto(null);
      setFormData({
        nome: '',
        sku: '',
        categoria: '',
        descricao: '',
        peso_gramas: '',
        imagem_url: '',
        quantidade_atual: '0',
        quantidade_minima: '1',
      });
    }
    setModalOpen(true);
  };

  const handleOpenMovimentacaoModal = (produto: Produto) => {
    setSelectedProduto(produto);
    setMovimentacao({
      tipo: 'entrada',
      quantidade: '',
      motivo: '',
      observacao: '',
    });
    setMovimentacaoModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const produtoData = {
        ...formData,
        lojista_id: user.id,
        peso_gramas: formData.peso_gramas ? parseInt(formData.peso_gramas) : null,
        quantidade_atual: parseInt(formData.quantidade_atual),
        quantidade_minima: parseInt(formData.quantidade_minima),
      };

      if (editingProduto) {
        const { error } = await supabase
          .from('produtos_estoque')
          .update(produtoData)
          .eq('id', editingProduto.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('produtos_estoque')
          .insert(produtoData);

        if (error) throw error;
      }

      setModalOpen(false);
      loadProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleMovimentacao = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduto) return;

    try {
      const quantidade = parseInt(movimentacao.quantidade);
      let novaQuantidade = selectedProduto.quantidade_atual;

      if (movimentacao.tipo === 'entrada') {
        novaQuantidade += quantidade;
      } else if (movimentacao.tipo === 'saida') {
        novaQuantidade -= quantidade;
      } else {
        novaQuantidade = quantidade;
      }

      const { error: updateError } = await supabase
        .from('produtos_estoque')
        .update({ quantidade_atual: novaQuantidade })
        .eq('id', selectedProduto.id);

      if (updateError) throw updateError;

      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert({
          produto_id: selectedProduto.id,
          tipo: movimentacao.tipo,
          quantidade: quantidade,
          motivo: movimentacao.motivo,
          observacao: movimentacao.observacao,
        });

      if (movError) throw movError;

      setMovimentacaoModalOpen(false);
      loadProdutos();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Meus Produtos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="animate-pulse h-64" />
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
          <h1 className="text-3xl font-bold text-white">Meus Produtos</h1>
          <p className="text-gray-400 mt-1">{produtos.length} produto(s) cadastrado(s)</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Novo Produto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produtos.map((produto) => (
          <Card key={produto.id} hover>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#E11D48]/10 rounded-lg">
                    <Package className="text-[#E11D48]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{produto.nome}</h3>
                    <p className="text-xs text-gray-500">SKU: {produto.sku}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenModal(produto)}
                >
                  <Edit size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0A0A0A] rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Estoque Atual</p>
                  <p className="text-2xl font-bold text-white">{produto.quantidade_atual}</p>
                </div>
                <div className="p-3 bg-[#0A0A0A] rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Mínimo</p>
                  <p className="text-2xl font-bold text-white">{produto.quantidade_minima}</p>
                </div>
              </div>

              {produto.localizacao ? (
                <div className="flex items-center gap-2 text-[#E11D48] text-sm">
                  <MapPin size={14} />
                  <span>Localização: {produto.localizacao}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin size={14} />
                  <span>Aguardando localização</span>
                </div>
              )}

              {produto.quantidade_atual <= produto.quantidade_minima && (
                <Badge variant="warning">Estoque Baixo</Badge>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => handleOpenMovimentacaoModal(produto)}
              >
                <TrendingUp size={16} />
                Movimentar Estoque
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {produtos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg">Nenhum produto cadastrado</p>
            <p className="text-gray-500 text-sm mt-2 mb-4">
              Comece adicionando seus produtos ao estoque
            </p>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <Plus size={20} />
              Adicionar Primeiro Produto
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduto ? 'Editar Produto' : 'Novo Produto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome do Produto *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
            <Input
              label="SKU *"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>

          <Input
            label="Categoria"
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors resize-none"
              rows={3}
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Peso (gramas)"
              type="number"
              value={formData.peso_gramas}
              onChange={(e) => setFormData({ ...formData, peso_gramas: e.target.value })}
            />
            <Input
              label="Quantidade *"
              type="number"
              value={formData.quantidade_atual}
              onChange={(e) => setFormData({ ...formData, quantidade_atual: e.target.value })}
              required
            />
            <Input
              label="Mínimo *"
              type="number"
              value={formData.quantidade_minima}
              onChange={(e) => setFormData({ ...formData, quantidade_minima: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingProduto ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={movimentacaoModalOpen}
        onClose={() => setMovimentacaoModalOpen(false)}
        title="Movimentar Estoque"
      >
        {selectedProduto && (
          <form onSubmit={handleMovimentacao} className="space-y-4">
            <div className="p-4 bg-[#0A0A0A] rounded-lg">
              <p className="text-sm text-gray-400">Produto</p>
              <p className="text-white font-semibold">{selectedProduto.nome}</p>
              <p className="text-sm text-gray-400 mt-1">
                Estoque atual: {selectedProduto.quantidade_atual}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Movimentação *
              </label>
              <select
                className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg text-white focus:outline-none focus:border-[#E11D48] transition-colors"
                value={movimentacao.tipo}
                onChange={(e) => setMovimentacao({ ...movimentacao, tipo: e.target.value as any })}
                required
              >
                <option value="entrada">Entrada (Adicionar)</option>
                <option value="saida">Saída (Remover)</option>
                <option value="ajuste">Ajuste (Definir quantidade)</option>
              </select>
            </div>

            <Input
              label="Quantidade *"
              type="number"
              min="1"
              value={movimentacao.quantidade}
              onChange={(e) => setMovimentacao({ ...movimentacao, quantidade: e.target.value })}
              required
            />

            <Input
              label="Motivo"
              value={movimentacao.motivo}
              onChange={(e) => setMovimentacao({ ...movimentacao, motivo: e.target.value })}
              placeholder="Ex: Reposição, Avaria, Inventário"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Observação
              </label>
              <textarea
                className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors resize-none"
                rows={2}
                value={movimentacao.observacao}
                onChange={(e) => setMovimentacao({ ...movimentacao, observacao: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMovimentacaoModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Confirmar Movimentação
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
