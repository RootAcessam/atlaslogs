import { useState, FormEvent } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-[#E11D48]">ATLAS</span>{' '}
            <span className="text-white">LOGS</span>
          </h1>
          <p className="text-gray-400">Sistema de Gestão de Fulfillment</p>
        </div>

        <div className="bg-[#121212] border border-[#1F1F1F] rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#E11D48]/10 rounded-lg">
              <LogIn className="text-[#E11D48]" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Entrar no Sistema</h2>
              <p className="text-sm text-gray-400">Acesse sua conta</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#E11D48]/10 border border-[#E11D48]/50 rounded-lg text-[#E11D48] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1F1F1F]">
            <p className="text-xs text-gray-400 text-center">
              ATLAS LOGS - Sistema de Fulfillment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
