import { useEffect, useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, User, Phone, Mail } from 'lucide-react';
import type { Database } from '../../types/database.types';

type Lojista = Database['public']['Tables']['lojistas']['Row'];

export const GestaoLojistas = () => {
  const [lojistas, setLojistas] = useState<Lojista[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLojista, setEditingLojista] = useState<Lojista | null>(null);

  const [formData, setFormData] = useState({
    nome_fantasia: '',
    nome_contato: '',
    email: '',
    telefone: '',
    cnpj: '',
    comissao_percentual: '15.00',
    endereco_completo: '',
    observacoes: '',
  });

  useEffect(() => {
    loadLojistas();
  }, []);

  const loadLojistas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojistas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLojistas(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (lojista?: Lojista) => {
    if (lojista) {
      setEditingLojista(lojista);
      setFormData({
        nome_fantasia: lojista.nome_fantasia,
        nome_contato: lojista.nome_contato || '',
        email: lojista.email,
        telefone: lojista.telefone,
        cnpj: lojista.cnpj || '',
        comissao_percentual: lojista.comissao_percentual.toString(),
        endereco_completo: lojista.endereco_completo || '',
        observacoes: lojista.observacoes || '',
      });
    } else {
      setEditingLojista(null);
      setFormData({
        nome_fantasia: '',
        nome_contato: '',
        email: '',
        telefone: '',
        cnpj: '',
        comissao_percentual: '15.00',
        endereco_completo: '',
        observacoes: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (editingLojista) {
        const { error } = await supabase
          .from('lojistas')
          .update({
            ...formData,
            comissao_percentual: parseFloat(formData.comissao_percentual),
          })
          .eq('id', editingLojista.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('lojistas').insert({
          ...formData,
          comissao_percentual: parseFloat(formData.comissao_percentual),
        });

        if (error) throw error;
      }

      setModalOpen(false);
      loadLojistas();
    } catch (error) {
      console.error('Erro ao salvar lojista:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Gestão de Lojistas</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="animate-pulse h-48" />
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
          <h1 className="text-3xl font-bold text-white">Gestão de Lojistas</h1>
          <p className="text-gray-400 mt-1">{lojistas.length} lojista(s) cadastrado(s)</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Novo Lojista
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lojistas.map((lojista) => (
          <Card key={lojista.id} hover>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#E11D48]/10 rounded-lg">
                    <User className="text-[#E11D48]" size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{lojista.nome_fantasia}</CardTitle>
                    <Badge variant={lojista.ativo ? 'success' : 'danger'}>
                      {lojista.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenModal(lojista)}
                >
                  <Edit size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User size={14} />
                <span>{lojista.nome_contato || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} />
                <span className="truncate">{lojista.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} />
                <span>{lojista.telefone}</span>
              </div>
              <div className="pt-3 border-t border-[#1F1F1F]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Comissão</span>
                  <span className="text-sm text-[#E11D48] font-semibold">
                    {lojista.comissao_percentual}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLojista ? 'Editar Lojista' : 'Novo Lojista'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome Fantasia *"
              value={formData.nome_fantasia}
              onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
              required
            />
            <Input
              label="Nome do Contato"
              value={formData.nome_contato}
              onChange={(e) => setFormData({ ...formData, nome_contato: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Telefone *"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            />
            <Input
              label="Comissão (%)"
              type="number"
              step="0.01"
              value={formData.comissao_percentual}
              onChange={(e) => setFormData({ ...formData, comissao_percentual: e.target.value })}
              required
            />
          </div>

          <Input
            label="Endereço Completo"
            value={formData.endereco_completo}
            onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors resize-none"
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingLojista ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
