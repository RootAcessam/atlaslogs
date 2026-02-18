import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { FilaSeparacao } from './pages/admin/FilaSeparacao';
import { GestaoLojistas } from './pages/admin/GestaoLojistas';
import { EstoqueCompleto } from './pages/admin/EstoqueCompleto';
import { LojistaDashboard } from './pages/lojista/LojistaDashboard';
import { MeusProdutos } from './pages/lojista/MeusProdutos';
import { LancarVenda } from './pages/lojista/LancarVenda';
import { Pedidos } from './pages/shared/Pedidos';
import { Notificacoes } from './pages/shared/Notificacoes';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [currentPath, setCurrentPath] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E11D48] mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    if (isAdmin) {
      switch (currentPath) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'fila':
          return <FilaSeparacao />;
        case 'pedidos':
          return <Pedidos />;
        case 'estoque':
          return <EstoqueCompleto />;
        case 'lojistas':
          return <GestaoLojistas />;
        case 'notificacoes':
          return <Notificacoes />;
        case 'mapa':
          return (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">Mapa do Armazém</h1>
              <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
            </div>
          );
        case 'relatorios':
          return (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">Relatórios</h1>
              <p className="text-gray-400">Funcionalidade em desenvolvimento</p>
            </div>
          );
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (currentPath) {
        case 'dashboard':
          return <LojistaDashboard />;
        case 'produtos':
          return <MeusProdutos />;
        case 'lancar-venda':
          return <LancarVenda />;
        case 'pedidos':
          return <Pedidos />;
        case 'notificacoes':
          return <Notificacoes />;
        default:
          return <LojistaDashboard />;
      }
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
