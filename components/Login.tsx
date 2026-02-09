
import React, { useState } from 'react';
import { Logo } from './Logo';
import { realtimeService } from '../services/socket';
import { AlertCircle, Lock } from 'lucide-react';

export const Login: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await realtimeService.signInWithGoogle();
            // O redirecionamento é automático pelo Supabase
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Falha ao conectar com Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#00020A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-af-blue/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-af-blue/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10" 
                    style={{ 
                        backgroundImage: 'linear-gradient(rgba(20, 64, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 64, 255, 0.3) 1px, transparent 1px)', 
                        backgroundSize: '40px 40px' 
                    }} 
                />
            </div>

            <div className="bg-[#0A0C14] border border-gray-800 rounded-2xl p-8 md:p-12 w-full max-w-md shadow-2xl relative z-10 flex flex-col items-center">
                <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
                    <Logo className="h-10" />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white font-heading mb-2">Bem-vindo ao Monitor</h1>
                    <p className="text-af-gray-200 text-sm">Acesse o painel de controle da sua Inteligência Artificial.</p>
                </div>

                {error && (
                    <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-start gap-2 text-red-400 text-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span>Entrar com Google</span>
                        </>
                    )}
                </button>

                <div className="mt-8 flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Lock size={12} />
                    <span>Acesso seguro via Supabase Auth</span>
                </div>
            </div>

            <div className="absolute bottom-4 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">AutoForce Tecnologia &copy; {new Date().getFullYear()}</p>
            </div>
        </div>
    );
};
