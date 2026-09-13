'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { getSession, login } from '@/lib/api-client';
import { useMutation } from '@/lib/useApi';
import { Field, FormError, TextInput } from '@/components/ui/Form';
import { SalunIcon } from '@/components/brand/SalunLogo';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate, pending, error } = useMutation(login);

  // An operator who still has a live session should never be made to type it again.
  useEffect(() => {
    if (getSession()) router.replace('/');
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const session = await mutate(email.trim(), password);
    if (session) router.replace('/');
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_minmax(420px,42%)]">
      {/*
        The left panel states plainly what this console is for. It matters because there are four
        front ends against this backend and they all accept the same credentials — an owner who
        lands here by mistake should be able to tell from the page, not from a 403 further in.
      */}
      <aside className="flex flex-col justify-between bg-ink px-8 py-10 lg:px-14 lg:py-14">
        <div>
          <div className="flex items-center gap-2.5">
            <SalunIcon size={30} />
            <p className="font-display text-[20px] leading-none font-extrabold tracking-[-0.02em] text-white">
              Salun<span className="text-[#635BFF]">BD</span>
            </p>
          </div>
          <p className="eyebrow mt-2 !text-white/40">Platform console</p>
        </div>

        <div className="hidden max-w-[34ch] py-16 lg:block">
          <h1 className="font-display text-[38px] leading-[1.05] font-extrabold tracking-[-0.035em] text-white">
            Every shop on the platform, and what each one is actually doing.
          </h1>
          <p className="mt-5 text-[13px] leading-relaxed text-white/50">
            This console is for platform operators. Shop owners manage their own salon on the owner
            dashboard, and barbers and customers use the mobile apps.
          </p>
        </div>

        <p className="tabular text-[11px] text-white/30">Super admin access required</p>
      </aside>

      <main className="flex items-center px-8 py-14 lg:px-14">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="font-display text-[24px] leading-none font-extrabold tracking-[-0.03em]">
              Sign in
            </h2>
            <p className="mt-2 text-[13px] text-ink-2">Use your platform operator account.</p>
          </div>

          <FormError message={error} />

          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </Field>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-ink px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-ink-3"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {pending ? 'Signing in' : 'Sign in'}
          </button>
        </form>
      </main>
    </div>
  );
}
