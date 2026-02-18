import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import {
  Package,
  PackageCheck,
  Truck,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  aguardando_separacao: number;
  em_separacao: number;
  embalado: number;
  enviados_hoje: number;
  total_produtos: number;
  estoque_baixo: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    aguardando_separacao: 0,
    em_separacao: 0,
    embalado: 0,
    enviados_hoje: 0,
    total_produtos: 0,
    estoque_baixo: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];

      const [pedidosResult, produtosResult] = await Promise.all([
        supabase.from('pedidos').select('status, data_envio'),
        supabase.from('produtos_estoque').select('quantidade_atual, quantidade_minima')
      ]);

      const pedidos = pedidosResult.data || [];
      const produtos = produtosResult.data || [];

      const aguardando = pedidos.filter(p => p.status === 'aguardando_separacao').length;
      const emSeparacao = pedidos.filter(p => p.status === 'em_separacao').length;
      const embalado = pedidos.filter(p => p.status === 'embalado').length;
      const enviadosHoje = pedidos.filter(p =>
        p.status === 'enviado' && p.data_envio?.startsWith(hoje)
      ).length;

      const estoqueBaixo = produtos.filter(p =>
        p.quantidade_atual <= p.quantidade_minima
      ).length;

      setStats({
        aguardando_separacao: aguardando,
        em_separacao: emSeparacao,
        embalado: embalado,
        enviados_hoje: enviadosHoje,
        total_produtos: produtos.length,
        estoque_baixo: estoqueBaixo,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Aguardando Separação',
      value: stats.aguardando_separacao,
      icon: <Clock size={24} />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
    },
    {
      title: 'Em Separação',
      value: stats.em_separacao,
      icon: <Package size={24} />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
    },
    {
      title: 'Embalados',
      value: stats.embalado,
      icon: <PackageCheck size={24} />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
    },
    {
      title: 'Enviados Hoje',
      value: stats.enviados_hoje,
      icon: <Truck size={24} />,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
    },
    {
      title: 'Total de Produtos',
      value: stats.total_produtos,
      icon: <TrendingUp size={24} />,
      color: 'text-[#E11D48]',
      bgColor: 'bg-[#E11D48]/20',
    },
    {
      title: 'Estoque Baixo',
      value: stats.estoque_baixo,
      icon: <AlertCircle size={24} />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <div className="animate-pulse h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <Badge variant="success">Sistema Online</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} hover>
            <CardContent className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className="text-4xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg">
                <div className="p-2 bg-green-900/20 rounded">
                  <PackageCheck className="text-green-400" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Pedido #1234 enviado</p>
                  <p className="text-xs text-gray-400">Há 10 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg">
                <div className="p-2 bg-blue-900/20 rounded">
                  <Package className="text-blue-400" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Nova venda lançada</p>
                  <p className="text-xs text-gray-400">Há 25 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg">
                <div className="p-2 bg-yellow-900/20 rounded">
                  <AlertCircle className="text-yellow-400" size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Estoque baixo: Produto XYZ</p>
                  <p className="text-xs text-gray-400">Há 1 hora</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Taxa de Separação</span>
                <span className="text-sm text-white font-semibold">96%</span>
              </div>
              <div className="w-full bg-[#1F1F1F] rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }} />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-400">Capacidade do Armazém</span>
                <span className="text-sm text-white font-semibold">68%</span>
              </div>
              <div className="w-full bg-[#1F1F1F] rounded-full h-2">
                <div className="bg-[#E11D48] h-2 rounded-full" style={{ width: '68%' }} />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-400">Eficiência de Entrega</span>
                <span className="text-sm text-white font-semibold">92%</span>
              </div>
              <div className="w-full bg-[#1F1F1F] rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
