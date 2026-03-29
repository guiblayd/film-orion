import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type View = 'login' | 'signup' | 'recovery' | 'reset';

const COPY = {
  brandingSubtitle: 'Compartilhe o que vale a pena assistir',
  invalidCredentials: 'Email ou senha incorretos.',
  emailNotConfirmed: 'Confirme seu email antes de entrar.',
  emailInUse: 'Este email j\u00e1 est\u00e1 em uso.',
  invalidEmail: 'Formato de email inv\u00e1lido.',
  tooManyAttempts: 'Muitas tentativas. Aguarde alguns minutos.',
  fillEmailPassword: 'Preencha email e senha.',
  fillName: 'Informe seu nome.',
  fillEmail: 'Informe seu email.',
  passwordMin: 'A senha deve ter pelo menos 6 caracteres.',
  signupSuccess: 'Conta criada! Verifique seu email para confirmar.',
  recoverySuccess: 'Link de recupera\u00e7\u00e3o enviado para seu email.',
  resetSuccess: 'Senha atualizada com sucesso!',
  resetTitle: 'Nova senha',
  resetPlaceholder: 'Nova senha (m\u00edn. 6 caracteres)',
  savePassword: 'Salvar senha',
  back: 'Voltar',
  recoveryTitle: 'Recuperar senha',
  recoverySubtitle: 'Enviaremos um link para redefinir sua senha.',
  sendLink: 'Enviar link',
  email: 'Email',
  password: 'Senha',
  login: 'Entrar',
  continueWithGoogle: 'Continuar com Google',
  guest: 'Entrar como visitante',
  guestHint: 'Voc\u00ea pode navegar pelo app, mas sem comentar, seguir ou enviar indica\u00e7\u00f5es.',
  noAccount: 'N\u00e3o tem conta?',
  signupCta: 'Cadastrar',
  forgotPassword: 'Esqueceu a senha?',
  name: 'Seu nome',
  signupPasswordPlaceholder: 'Senha (m\u00edn. 6 caracteres)',
  createAccount: 'Criar conta',
  haveAccount: 'J\u00e1 tem conta?',
  enter: 'Entrar',
  or: 'ou',
} as const;

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': COPY.invalidCredentials,
  'Email not confirmed': COPY.emailNotConfirmed,
  'User already registered': COPY.emailInUse,
  'Password should be at least 6 characters': COPY.passwordMin,
  'Unable to validate email address: invalid format': COPY.invalidEmail,
  'Email rate limit exceeded': COPY.tooManyAttempts,
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

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError(COPY.fillEmailPassword);
      return;
    }

    setLoading(true);
    reset();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(translateError(error.message));
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      setError(COPY.fillName);
      return;
    }

    if (!email) {
      setError(COPY.fillEmail);
      return;
    }

    if (password.length < 6) {
      setError(COPY.passwordMin);
      return;
    }

    setLoading(true);
    reset();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) setError(translateError(error.message));
    else setSuccess(COPY.signupSuccess);
    setLoading(false);
  };

  const handleRecovery = async () => {
    if (!email) {
      setError(COPY.fillEmail);
      return;
    }

    setLoading(true);
    reset();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) setError(translateError(error.message));
    else setSuccess(COPY.recoverySuccess);
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError(COPY.passwordMin);
      return;
    }

    setLoading(true);
    reset();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(translateError(error.message));
    else setSuccess(COPY.resetSuccess);
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">FilmOrion</h1>
        <p className="mt-1 text-sm text-zinc-500">{COPY.brandingSubtitle}</p>
      </div>

      <div className="w-full max-w-sm">
        {view === 'reset' && (
          <div className="space-y-3">
            <h2 className="mb-5 text-lg font-bold text-zinc-100">{COPY.resetTitle}</h2>
            <Field
              icon={<Lock size={15} />}
              type={showPassword ? 'text' : 'password'}
              placeholder={COPY.resetPlaceholder}
              value={newPassword}
              onChange={setNewPassword}
              right={(
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-zinc-500">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
            />
            <Feedback error={error} success={success} />
            <SubmitButton loading={loading} onClick={handleResetPassword}>
              {COPY.savePassword}
            </SubmitButton>
          </div>
        )}

        {view === 'recovery' && (
          <div className="space-y-3">
            <button onClick={() => { setView('login'); reset(); }} className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300">
              {COPY.back}
            </button>
            <h2 className="mb-1 text-lg font-bold text-zinc-100">{COPY.recoveryTitle}</h2>
            <p className="mb-4 text-sm text-zinc-500">{COPY.recoverySubtitle}</p>
            <Field
              icon={<Mail size={15} />}
              type="email"
              placeholder={COPY.email}
              value={email}
              onChange={setEmail}
            />
            <Feedback error={error} success={success} />
            <SubmitButton loading={loading} onClick={handleRecovery}>
              {COPY.sendLink}
            </SubmitButton>
          </div>
        )}

        {view === 'login' && (
          <div className="space-y-3">
            <Field
              icon={<Mail size={15} />}
              type="email"
              placeholder={COPY.email}
              value={email}
              onChange={setEmail}
            />
            <Field
              icon={<Lock size={15} />}
              type={showPassword ? 'text' : 'password'}
              placeholder={COPY.password}
              value={password}
              onChange={setPassword}
              onEnter={handleLogin}
              right={(
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-zinc-500 transition-colors hover:text-zinc-300">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
            />
            <Feedback error={error} success={success} />
            <SubmitButton loading={loading} onClick={handleLogin}>
              {COPY.login}
            </SubmitButton>
            <Divider />
            <GoogleButton onClick={handleGoogle} />
            <button
              type="button"
              onClick={enterGuestMode}
              className="w-full rounded-xl border border-zinc-800 bg-transparent py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70"
            >
              {COPY.guest}
            </button>
            <p className="px-1 text-center text-xs leading-relaxed text-zinc-600">{COPY.guestHint}</p>
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={() => { setView('signup'); reset(); }}
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
              >
                {COPY.noAccount} <span className="font-medium text-zinc-200">{COPY.signupCta}</span>
              </button>
              <button
                onClick={() => { setView('recovery'); reset(); }}
                className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
              >
                {COPY.forgotPassword}
              </button>
            </div>
          </div>
        )}

        {view === 'signup' && (
          <div className="space-y-3">
            <Field
              icon={<User size={15} />}
              type="text"
              placeholder={COPY.name}
              value={name}
              onChange={setName}
            />
            <Field
              icon={<Mail size={15} />}
              type="email"
              placeholder={COPY.email}
              value={email}
              onChange={setEmail}
            />
            <Field
              icon={<Lock size={15} />}
              type={showPassword ? 'text' : 'password'}
              placeholder={COPY.signupPasswordPlaceholder}
              value={password}
              onChange={setPassword}
              onEnter={handleSignup}
              right={(
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-zinc-500 transition-colors hover:text-zinc-300">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
            />
            <Feedback error={error} success={success} />
            <SubmitButton loading={loading} onClick={handleSignup}>
              {COPY.createAccount}
            </SubmitButton>
            <Divider />
            <GoogleButton onClick={handleGoogle} />
            <div className="flex justify-center pt-2">
              <button
                onClick={() => { setView('login'); reset(); }}
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
              >
                {COPY.haveAccount} <span className="font-medium text-zinc-200">{COPY.enter}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  right,
  onEnter,
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
    <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-3 transition-colors focus-within:border-zinc-600">
      <span className="shrink-0 text-zinc-600">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => event.key === 'Enter' && onEnter?.()}
        className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
      />
      {right}
    </div>
  );
}

function SubmitButton({
  loading,
  onClick,
  children,
}: {
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-950" /> : null}
      {children}
    </button>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98]"
    >
      <GoogleIcon />
      {COPY.continueWithGoogle}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-zinc-800" />
      <span className="text-xs text-zinc-600">{COPY.or}</span>
      <div className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

function Feedback({ error, success }: { error: string | null; success: string | null }) {
  if (error) return <p className="px-1 text-xs text-rose-400">{error}</p>;
  if (success) return <p className="px-1 text-xs text-emerald-400">{success}</p>;
  return null;
}
