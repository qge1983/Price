import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, Lock, ShieldCheck, TriangleAlert, User, type LucideIcon } from 'lucide-react';
import { Logo } from './Logo';
import { checkCredentials, saveSession } from '../lib/auth';
import { loadRates } from '../lib/rates';
import { CONFIG } from '../config';
import { cn } from '../utils/cn';

const inputClass =
  'h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-11 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/15';

function Field({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-neutral-700">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
        {children}
      </span>
    </label>
  );
}

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = '#0a0a0a';
    loadRates().catch(() => undefined); // start loading rates while the salesman types
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  const fail = (msg: string) => {
    setError(msg);
    setShaking(true);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password.trim()) {
      fail('Please enter your username and password.');
      return;
    }
    setBusy(true);
    setError('');
    const [ok] = await Promise.all([
      checkCredentials(username, password),
      new Promise((resolve) => window.setTimeout(resolve, 450)),
    ]);
    if (ok) {
      saveSession(remember);
      onSuccess();
      return;
    }
    setBusy(false);
    fail('Invalid username or password.');
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4 py-10">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-red-600/30 blur-[130px]" />
        <div className="absolute -bottom-56 -right-40 h-[460px] w-[460px] rounded-full bg-red-800/25 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_72%)]" />
      </div>

      <div className="relative w-full max-w-[390px] animate-rise">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo size={68} />
          <h1 className="mt-4 text-[26px] font-black tracking-tight text-white">QAISER GROUP</h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.36em] text-red-500">of Electronics</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          onAnimationEnd={() => setShaking(false)}
          className={cn(
            'rounded-3xl bg-white p-6 shadow-2xl shadow-black/50 ring-1 ring-white/10 sm:p-7',
            shaking && 'animate-shake',
          )}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-red-600 ring-1 ring-inset ring-red-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            {CONFIG.portalName}
          </span>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-neutral-900">Welcome back</h2>
          <p className="mt-1 text-sm text-neutral-500">Sign in to view the latest cash, installment &amp; fix rates.</p>

          <div className="mt-6 space-y-4">
            <Field label="Username" icon={User}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Enter username"
                className={cn(inputClass, 'pr-3')}
              />
            </Field>

            <Field label="Password" icon={Lock}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Enter password"
                className={cn(inputClass, 'pr-12')}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-200/60 hover:text-neutral-700"
              >
                {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </Field>
          </div>

          <label className="mt-4 flex w-fit cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-neutral-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="peer sr-only"
            />
            <span className="grid h-5 w-5 place-items-center rounded-md border border-neutral-300 bg-white text-white transition peer-checked:border-red-600 peer-checked:bg-red-600 peer-focus-visible:ring-4 peer-focus-visible:ring-red-500/20">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            Keep me signed in
          </label>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-100"
            >
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="group mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-[15px] font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Authorized sales staff only · © {new Date().getFullYear()} {CONFIG.companyName}
        </p>
      </div>
    </div>
  );
}
