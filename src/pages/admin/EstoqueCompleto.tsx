import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { Package, MapPin, AlertCircle, Search } from 'lucide-react';
import type { Database } from '../../types/database.types';

type Produto = Database['public']['Tables']['produtos_estoque']['Row'] & {
  lojista: { nome_fantasia: string };
};

export const EstoqueCompleto = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [novaLocalizacao, setNovaLocalizacao] = useState('');

  useEffect(() => {
    loadProdutos();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = produtos.filter(
        (p) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.lojista.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProdutos(filtered);
    } else {
      setFilteredProdutos(produtos);
    }
  }, [searchTerm, produtos]);

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos_estoque')
        .select(`
          *,
          lojista:lojistas(nome_fantasia)
        `)
        .order('quantidade_atual', { ascending: true });

      if (error) throw error;
      setProdutos((data as any) || []);
      setFilteredProdutos((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDefinirLocalizacao = (produto: Produto) => {
    setSelectedProduto(produto);
    setNovaLocalizacao(produto.localizacao || '');
    setModalOpen(true);
  };

  const salvarLocalizacao = async () => {
    if (!selectedProduto) return;

    try {
      const { error } = await supabase
        .from('produtos_estoque')
        .update({ localizacao: novaLocalizacao })
        .eq('id', selectedProduto.id);

      if (error) throw error;
      setModalOpen(false);
      loadProdutos();
    } catch (error) {
      console.error('Erro ao salvar localização:', error);
    }
  };

  const getStatusBadge = (produto: Produto) => {
    if (produto.quantidade_atual === 0) {
      return <Badge variant="danger">SEM ESTOQUE</Badge>;
    }
    if (produto.quantidade_atual <= produto.quantidade_minima) {
      return <Badge variant="warning">ESTOQUE BAIXO</Badge>;
    }
    if (!produto.localizacao) {
      return <Badge variant="info">SEM LOCALIZAÇÃO</Badge>;
    }
    return <Badge variant="success">OK</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Estoque Completo</h1>
        <Card>
          <div className="animate-pulse h-96" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Estoque Completo</h1>
        <p className="text-gray-400 mt-1">{produtos.length} produto(s) cadastrado(s)</p>
      </div>

      <Card>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por produto, SKU ou lojista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F1F1F]">
                <th className="text-left p-4 text-sm font-semibold text-gray-400">Lojista</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-400">Produto</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-400">SKU</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-400">Quantidade</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-400">Mínimo</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-400">Localização</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProdutos.map((produto, index) => (
                <tr
                  key={produto.id}
                  className={`border-b border-[#1F1F1F] ${
                    index % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#121212]'
                  } hover:bg-[#1F1F1F] transition-colors`}
                >
                  <td className="p-4 text-sm text-white">
                    {produto.lojista.nome_fantasia}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-sm text-white">{produto.nome}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">{produto.sku}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-sm font-semibold ${
                        produto.quantidade_atual === 0
                          ? 'text-[#E11D48]'
                          : produto.quantidade_atual <= produto.quantidade_minima
                          ? 'text-yellow-400'
                          : 'text-white'
                      }`}
                    >
                      {produto.quantidade_atual}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm text-gray-400">
                    {produto.quantidade_minima}
                  </td>
                  <td className="p-4">
                    {produto.localizacao ? (
                      <div className="flex items-center gap-1 text-[#E11D48] text-sm">
                        <MapPin size={14} />
                        <span>{produto.localizacao}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <AlertCircle size={14} />
                        <span>Não definida</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">{getStatusBadge(produto)}</td>
                  <td className="p-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDefinirLocalizacao(produto)}
                    >
                      <MapPin size={14} />
                      Definir Local
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProdutos.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-600 mb-4" size={48} />
              <p className="text-gray-400">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Definir Localização no Armazém"
      >
        {selectedProduto && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0A0A0A] rounded-lg">
              <p className="text-sm text-gray-400">Produto</p>
              <p className="text-white font-semibold">{selectedProduto.nome}</p>
              <p className="text-sm text-gray-400 mt-1">SKU: {selectedProduto.sku}</p>
            </div>

            <Input
              label="Localização (ex: A-12, B-05, C-33)"
              value={novaLocalizacao}
              onChange={(e) => setNovaLocalizacao(e.target.value)}
              placeholder="Digite a localização"
            />

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={salvarLocalizacao}>
                Salvar Localização
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
