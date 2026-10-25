'use client';

import Image from 'next/image';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { messages } from '@/lib/messages';
import alertIcon from './images/alert.svg';
import chevronLeft from './images/chevron-left.svg';
import googleLogo from './images/google.svg';
import logo from './images/logo.png';
import { enter, Words } from './motion';
import { codeLength, formatCooldown, toCode } from './sign-in-code';

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function errorCode(response: Response): Promise<string> {
  if (response.status === 429) return 'RATE_LIMITED';

  const body = (await response.json().catch(() => null)) as {
    code?: string;
  } | null;

  return body?.code && body.code in messages ? body.code : 'UNKNOWN';
}

function Logo({ siteUrl, delay }: { siteUrl?: string; delay: number }) {
  return (
    <a
      href={siteUrl}
      className="animate-enter rounded-sm focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2"
      style={enter(delay, { duration: 500 })}
    >
      <Image
        src={logo}
        alt="Koalaflow"
        preload
        className="h-[30px] w-[140px] object-contain"
      />
    </a>
  );
}

function ErrorMessage({ id, code }: { id?: string; code: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1 text-danger text-xs leading-4"
    >
      <Image src={alertIcon} alt="" className="shrink-0" />
      {messages[code]}
    </p>
  );
}

function Header({
  siteUrl,
  title,
  delay,
  children,
}: {
  siteUrl?: string;
  title: string;
  delay: { logo: number; title: number; description: number };
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Logo siteUrl={siteUrl} delay={delay.logo} />
      <h1 className="font-bold text-[28px] text-text-primary leading-9 tracking-[-0.28px]">
        <Words text={title} delay={delay.title} step={100} />
      </h1>
      <p
        className="animate-enter text-sm text-text-secondary leading-5"
        style={enter(delay.description, { y: 12 })}
      >
        {children}
      </p>
    </div>
  );
}

export function LoginForm({
  siteUrl,
  googleFailed,
}: {
  siteUrl?: string;
  googleFailed: boolean;
}) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(googleFailed ? 'GOOGLE' : '');

  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const emailInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (event && !event.currentTarget.checkValidity()) {
      return setError('INVALID_EMAIL');
    }

    setPending(true);
    setError('');

    const response = await post('email-otp/send-verification-otp', {
      email,
      type: 'sign-in',
    });

    setPending(false);

    if (!response.ok) return setError(await errorCode(response));

    flushSync(() => {
      setCode('');
      setCooldown(60);
      setStep('code');
    });

    codeInput.current?.focus();
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');

    const response = await post('sign-in/email-otp', { email, otp: code });

    if (response.ok) return window.location.assign('/');

    setPending(false);
    setError(await errorCode(response));
  }

  async function signInWithGoogle() {
    setPending(true);
    setError('');

    const response = await post('sign-in/social', {
      provider: 'google',
      callbackURL: '/',
      errorCallbackURL: '/login?error=google',
    });

    const body = (await response.json().catch(() => null)) as {
      url?: string;
    } | null;

    if (response.ok && body?.url) return window.location.assign(body.url);

    setPending(false);
    setError('GOOGLE');
  }

  function changeEmail() {
    flushSync(() => {
      setError('');
      setStep('email');
    });

    emailInput.current?.focus();
  }

  if (step === 'email') {
    const emailError = error && error !== 'GOOGLE' ? error : '';
    return (
      <div className="flex w-full max-w-[360px] flex-col gap-6">
        <Header
          siteUrl={siteUrl}
          title="Que bom ter você por aqui"
          delay={{ logo: 0, title: 150, description: 350 }}
        >
          Hospede e proteja seus vídeos em minutos. Privado por padrão, sem
          configurar servidor.
        </Header>

        <div
          className="flex animate-enter flex-col gap-2"
          style={enter(500, { y: 16 })}
        >
          <button
            type="button"
            disabled={pending}
            onClick={signInWithGoogle}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 font-semibold text-base text-text-primary leading-6 transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Image src={googleLogo} alt="" />
            Entrar com Google
          </button>
          {error === 'GOOGLE' && <ErrorMessage code={error} />}
        </div>

        <div
          className="flex animate-enter items-center gap-3"
          style={enter(600)}
        >
          <span className="h-px flex-1 bg-border" />
          <span className="text-text-tertiary text-xs leading-4">
            Ou entre com e-mail
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form noValidate onSubmit={sendCode} className="flex flex-col gap-6">
          <div
            className="flex animate-enter flex-col gap-2"
            style={enter(650, { y: 16 })}
          >
            <label
              htmlFor="email"
              className="font-semibold text-sm text-text-primary leading-5"
            >
              E-mail de Acesso
            </label>
            <input
              ref={emailInput}
              id="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? 'email-error' : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setError('');
              }}
              className="w-full rounded-xl border border-border bg-surface px-3 py-4 text-base text-text-body leading-6 outline-none transition-[border-color,box-shadow] placeholder:text-text-secondary focus:border-primary focus:ring-4 focus:ring-primary/20 aria-invalid:border-danger aria-invalid:focus:ring-danger/20"
            />
            {emailError && <ErrorMessage id="email-error" code={emailError} />}
          </div>
          <button
            type="submit"
            disabled={pending || !email}
            aria-busy={pending}
            className="button-primary animate-enter"
            style={enter(750, { y: 16 })}
          >
            {pending ? 'Enviando código…' : 'Enviar código'}
          </button>
        </form>

        <p
          className="animate-enter text-center text-text-tertiary text-xs leading-4"
          style={enter(900)}
        >
          Ao criar uma conta, você concorda com os{' '}
          <span className="text-text-primary underline">Termos de uso</span> e a{' '}
          <span className="text-text-primary underline">
            Política de privacidade
          </span>
          .
        </p>
      </div>
    );
  }

  const activeBox = Math.min(code.length, codeLength - 1);

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-6">
      <button
        type="button"
        onClick={changeEmail}
        className="flex animate-enter items-center gap-1 self-start rounded-sm text-sm text-text-secondary leading-5 transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2"
        style={enter(0, { duration: 500, x: -12 })}
      >
        <Image src={chevronLeft} alt="" />
        Usar outro e-mail
      </button>

      <Header
        siteUrl={siteUrl}
        title="Confira seu e-mail"
        delay={{ logo: 100, title: 250, description: 450 }}
      >
        Enviamos um código de 6 caracteres para{' '}
        <span className="wrap-break-word font-semibold text-text-primary">
          {email}
        </span>
        . Digite-o abaixo para entrar.
      </Header>

      <form onSubmit={signIn} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="group relative flex justify-center gap-2">
            {Array.from({ length: codeLength }, (_, index) => {
              const active = index === activeBox;
              return (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: each box is a fixed code position
                  key={index}
                  aria-hidden
                  className={`flex h-14 w-12 animate-enter items-center justify-center rounded-xl border bg-surface font-bold text-2xl text-text-primary leading-8 transition-[border-color,box-shadow] ${
                    error
                      ? 'border-danger'
                      : active
                        ? 'border-border group-has-focus:border-primary group-has-focus:ring-4 group-has-focus:ring-primary/20'
                        : 'border-border'
                  }`}
                  style={enter(550 + index * 60, {
                    duration: 450,
                    scale: 0.7,
                    pop: true,
                  })}
                >
                  {code[index] ??
                    (active && (
                      <span className="hidden h-6 w-[1.5px] animate-caret bg-text-primary group-has-focus:block" />
                    ))}
                </span>
              );
            })}
            <label htmlFor="code" className="sr-only">
              Código de acesso
            </label>
            <input
              ref={codeInput}
              id="code"
              required
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'code-error' : undefined}
              onChange={(event) => {
                setCode(toCode(event.target.value));
                setError('');
              }}
              className="absolute inset-0 cursor-text opacity-0"
            />
          </div>
          {error && <ErrorMessage id="code-error" code={error} />}
        </div>

        <button
          type="submit"
          disabled={pending || code.length < codeLength}
          aria-busy={pending}
          className="button-primary animate-enter"
          style={enter(950, { y: 16 })}
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p
        className="animate-enter text-center text-text-secondary text-xs leading-4"
        style={enter(1100)}
      >
        Não recebeu o código?{' '}
        {cooldown > 0 ? (
          `Reenviar em ${formatCooldown(cooldown)}`
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => sendCode()}
            className="rounded-sm text-text-primary underline transition-colors hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2"
          >
            Reenviar
          </button>
        )}
      </p>
    </div>
  );
}
