import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Bell,
  LogOut,
  Box,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  badge?: number;
}

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  notificationCount?: number;
}

export const Sidebar = ({ currentPath, onNavigate, notificationCount = 0 }: SidebarProps) => {
  const { isAdmin, lojista, signOut } = useAuth();

  const adminMenuItems: MenuItem[] = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: 'dashboard' },
    { icon: <ShoppingCart size={20} />, label: 'Fila de Separação', path: 'fila' },
    { icon: <Package size={20} />, label: 'Pedidos', path: 'pedidos' },
    { icon: <Box size={20} />, label: 'Estoque Completo', path: 'estoque' },
    { icon: <MapPin size={20} />, label: 'Mapa do Armazém', path: 'mapa' },
    { icon: <Users size={20} />, label: 'Lojistas', path: 'lojistas' },
    { icon: <TrendingUp size={20} />, label: 'Relatórios', path: 'relatorios' },
    { icon: <Bell size={20} />, label: 'Notificações', path: 'notificacoes', badge: notificationCount },
  ];

  const lojistaMenuItems: MenuItem[] = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: 'dashboard' },
    { icon: <Box size={20} />, label: 'Meus Produtos', path: 'produtos' },
    { icon: <ShoppingCart size={20} />, label: 'Lançar Venda', path: 'lancar-venda' },
    { icon: <Package size={20} />, label: 'Meus Pedidos', path: 'pedidos' },
    { icon: <Bell size={20} />, label: 'Notificações', path: 'notificacoes', badge: notificationCount },
  ];

  const menuItems = isAdmin ? adminMenuItems : lojistaMenuItems;

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-[#1F1F1F] h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-[#1F1F1F]">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-[#E11D48]">ATLAS</span>
          <span>LOGS</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isAdmin ? 'Painel Administrativo' : lojista?.nome_fantasia}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPath === item.path
                ? 'bg-[#E11D48] text-white shadow-lg shadow-red-500/20'
                : 'text-gray-300 hover:bg-[#1F1F1F] hover:text-white'
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left font-medium">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="bg-[#E11D48] text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1F1F1F]">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};
