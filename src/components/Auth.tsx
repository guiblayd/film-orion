import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

type View = 'login' | 'signup' | 'recovery' | 'reset';

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Confirme seu email antes de entrar.',
  'User already registered': 'Este email já está em uso.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'Formato de email inválido.',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
};

function translateError(msg: string): string {
  for (const [key, pt] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return pt;
  }
  return msg;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function Auth() {
  const { passwordRecovery, enterGuestMode } = useAuth();
  const [view, setView] = useState<View>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (passwordRecovery) setView('reset');
  }, [passwordRecovery]);

  const reset = () => { setError(null); setSuccess(null); };

  const handleLogin = async () => {
    if (!email || !password) { setError('Preencha email e senha.'); return; }
    setLoading(true); reset();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(translateError(error.message));
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (!email) { setError('Informe seu email.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true); reset();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) setError(translateError(error.message));
    else setSuccess('Conta criada! Verifique seu email para confirmar.');
    setLoading(false);
  };

  const handleRecovery = async () => {
    if (!email) { setError('Informe seu email.'); return; }
    setLoading(true); reset();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) setError(translateError(error.message));
    else setSuccess('Link de recuperação enviado para seu email.');
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true); reset();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(translateError(error.message));
    else setSuccess('Senha atualizada com sucesso!');
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 py-12">
      {/* Branding */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
          <span className="text-xl font-semibold text-zinc-950">I</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">FilmOrion</h1>
        <p className="text-zinc-500 text-sm mt-1">Compartilhe o que vale a pena assistir</p>
      </div>

      <div className="w-full max-w-sm">

        {/* Reset password */}
        {view === 'reset' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-100 mb-5">Nova senha</h2>
            <Field
              icon={<Lock size={15} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Nova senha (mín. 6 caracteres)"
              value={newPassword}
              onChange={setNewPassword}
              right={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-zinc-500">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            <Feedback error={error} success={success} />
            <SubmitButton loading={loading} onClick={handleResetPassword}>
              Salvar senha
            </SubmitButton>
          </div>
        )}

        {/* Recovery */}
        {view === 'recovery' && (
          <div className="space-y-3">
            <button onClick={() => { setView('login'); reset(); }} className="flex items-center gap-1.5 text-zinc-500 text-sm mb-4 hover:text-zinc-300 transition-colors">
              ← Voltar
            </button>
            <h2 className="text-lg font-bold text-zinc-100 mb-1">Recuperar senha</h2>
            <p className="text-zinc-500 text-sm mb-4">Enviaremos um link para redefinir sua senha.</p>
            <Field
              icon={<Mail size={15} />}
              type="email"
              placeholder="Email"
              value={email}
              onChange={setEmail}
            />
            <Feedback error={error} success={success} />
            <SubmitButton loading={loading} onClick={handleRecovery}>
              Enviar link
            </SubmitButton>
          </div>
        )}

        {/* Login */}
        {view === 'login' && (
          <div className="space-y-3">
            <Field
              icon={<Mail size={15} />}
              type="email"
              placeholder="Email"
              value={email}
              onChange={setEmail}
            />
            <Field
              icon={<Lock size={15} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={setPassword}
              onEnter={handleLogin}
              right={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            <Feedback error={error} success={success} />
            <SubmitButton loading={loading} onClick={handleLogin}>
              Entrar
            </SubmitButton>
            <Divider />
            <GoogleButton onClick={handleGoogle} />
            <button
              type="button"
              onClick={enterGuestMode}
              className="w-full rounded-xl border border-zinc-800 bg-transparent py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70"
            >
              Entrar como visitante
            </button>
            <p className="px-1 text-center text-xs leading-relaxed text-zinc-600">
              Voc\u00ea pode navegar pelo app, mas sem comentar, seguir ou enviar indica\u00e7\u00f5es.
            </p>
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={() => { setView('signup'); reset(); }}
                className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                Não tem conta? <span className="text-zinc-200 font-medium">Cadastrar</span>
              </button>
              <button
                onClick={() => { setView('recovery'); reset(); }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>
        )}

        {/* Signup */}
        {view === 'signup' && (
          <div className="space-y-3">
            <Field
              icon={<User size={15} />}
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={setName}
            />
            <Field
              icon={<Mail size={15} />}
              type="email"
              placeholder="Email"
              value={email}
              onChange={setEmail}
            />
            <Field
              icon={<Lock size={15} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha (mín. 6 caracteres)"
              value={password}
              onChange={setPassword}
              onEnter={handleSignup}
              right={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            <Feedback error={error} success={success} />
            <SubmitButton loading={loading} onClick={handleSignup}>
              Criar conta
            </SubmitButton>
            <Divider />
            <GoogleButton onClick={handleGoogle} />
            <div className="flex justify-center pt-2">
              <button
                onClick={() => { setView('login'); reset(); }}
                className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                Já tem conta? <span className="text-zinc-200 font-medium">Entrar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────

function Field({
  icon, type, placeholder, value, onChange, right, onEnter,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
  onEnter?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-3 focus-within:border-zinc-600 transition-colors">
      <span className="text-zinc-600 shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
      />
      {right}
    </div>
  );
}

function SubmitButton({ loading, onClick, children }: { loading: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading && <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />}
      {children}
    </button>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 bg-zinc-900 border border-zinc-800 text-zinc-200 font-medium py-3 rounded-xl text-sm hover:bg-zinc-800 hover:border-zinc-700 transition-colors active:scale-[0.98]"
    >
      <GoogleIcon />
      Continuar com Google
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-xs text-zinc-600">ou</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

function Feedback({ error, success }: { error: string | null; success: string | null }) {
  if (error) return <p className="text-xs text-rose-400 px-1">{error}</p>;
  if (success) return <p className="text-xs text-emerald-400 px-1">{success}</p>;
  return null;
}
