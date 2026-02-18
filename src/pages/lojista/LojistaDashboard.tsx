import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface LojistaStats {
  total_produtos: number;
  estoque_baixo: number;
  pedidos_pendentes: number;
  pedidos_enviados_mes: number;
  vendas_total_mes: number;
}

export const LojistaDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<LojistaStats>({
    total_produtos: 0,
    estoque_baixo: 0,
    pedidos_pendentes: 0,
    pedidos_enviados_mes: 0,
    vendas_total_mes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const primeiroDiaMes = new Date();
      primeiroDiaMes.setDate(1);
      primeiroDiaMes.setHours(0, 0, 0, 0);

      const [produtosResult, pedidosResult] = await Promise.all([
        supabase
          .from('produtos_estoque')
          .select('quantidade_atual, quantidade_minima')
          .eq('lojista_id', user.id),
        supabase
          .from('pedidos')
          .select('status, total_pedido, data_criacao')
          .eq('lojista_id', user.id)
      ]);

      const produtos = produtosResult.data || [];
      const pedidos = pedidosResult.data || [];

      const estoqueBaixo = produtos.filter(p =>
        p.quantidade_atual <= p.quantidade_minima
      ).length;

      const pedidosPendentes = pedidos.filter(p =>
        ['aguardando_separacao', 'em_separacao', 'embalado'].includes(p.status)
      ).length;

      const pedidosMes = pedidos.filter(p =>
        new Date(p.data_criacao) >= primeiroDiaMes
      );

      const pedidosEnviadosMes = pedidosMes.filter(p => p.status === 'enviado').length;
      const vendasTotalMes = pedidosMes.reduce((sum, p) => sum + parseFloat(p.total_pedido.toString()), 0);

      setStats({
        total_produtos: produtos.length,
        estoque_baixo: estoqueBaixo,
        pedidos_pendentes: pedidosPendentes,
        pedidos_enviados_mes: pedidosEnviadosMes,
        vendas_total_mes: vendasTotalMes,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total de Produtos',
      value: stats.total_produtos,
      icon: <Package size={24} />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
    },
    {
      title: 'Estoque Baixo',
      value: stats.estoque_baixo,
      icon: <AlertCircle size={24} />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
    },
    {
      title: 'Pedidos Pendentes',
      value: stats.pedidos_pendentes,
      icon: <Clock size={24} />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
    },
    {
      title: 'Enviados Este Mês',
      value: stats.pedidos_enviados_mes,
      icon: <CheckCircle size={24} />,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
    },
    {
      title: 'Vendas do Mês',
      value: `R$ ${stats.vendas_total_mes.toFixed(2)}`,
      icon: <TrendingUp size={24} />,
      color: 'text-[#E11D48]',
      bgColor: 'bg-[#E11D48]/20',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
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
        <Badge variant="success">Online</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} hover>
            <CardContent className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
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
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full p-4 bg-[#E11D48] hover:bg-[#DC2626] rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2">
              <ShoppingCart size={20} />
              Lançar Nova Venda
            </button>
            <button className="w-full p-4 bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2">
              <Package size={20} />
              Gerenciar Produtos
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-[#0A0A0A] rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Sistema de Fulfillment</p>
                <p className="text-sm text-white">
                  Gerencie seus produtos e acompanhe pedidos em tempo real
                </p>
              </div>
              <div className="p-3 bg-[#0A0A0A] rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Suporte</p>
                <p className="text-sm text-white">
                  Em caso de dúvidas, entre em contato com a ATLAS LOGS
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
