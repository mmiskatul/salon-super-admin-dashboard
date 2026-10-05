'use client';

import { useState } from 'react';
import { useApi, useMutation } from '@/lib/useApi';
import { adjustWallet, getUserWallet, getUserWalletEntries, type UserWallet, type UserWalletEntry } from '@/lib/api/users';
import { date, money } from '@/lib/format';
import { Badge } from './primitives';

/** A user's digital wallet balance and recent ledger entries — reused wherever an operator needs
 *  to inspect one account's money, whether reached from the Users roster or a barber's own detail
 *  view (a barber is a User, so the same wallet endpoints apply). */
export default function WalletPanel({ userId }: { userId: string }) {
  const walletApi = useApi(() => (userId ? getUserWallet(userId) : Promise.resolve(null)), [userId], 'wallet');
  const entriesApi = useApi(() => (userId ? getUserWalletEntries(userId) : Promise.resolve([])), [userId], 'wallet-entries');

  if (walletApi.loading) {
    return (
      <div className="rounded-lg border border-rule bg-surface p-3 text-xs text-ink-3">
        Loading wallet information…
      </div>
    );
  }

  const rawWallet = walletApi.data;
  const wallet: UserWallet | null =
    rawWallet && typeof rawWallet === 'object'
      ? 'data' in rawWallet && rawWallet.data
        ? (rawWallet as any).data
        : (rawWallet as UserWallet)
      : null;

  const rawEntries = entriesApi.data;
  const entries: UserWalletEntry[] = Array.isArray(rawEntries)
    ? rawEntries
    : Array.isArray((rawEntries as any)?.data)
    ? (rawEntries as any).data
    : Array.isArray((rawEntries as any)?.entries)
    ? (rawEntries as any).entries
    : [];

  const refresh = () => {
    walletApi.refresh();
    entriesApi.refresh();
  };
  const balance = Number(wallet?.balance ?? 0);

  return (
    <div className="space-y-3 rounded-lg border border-rule bg-surface p-3">
      <div className="flex items-center justify-between border-b border-rule-soft pb-2">
        <div>
          <span className="eyebrow !text-[10px]">Digital Wallet</span>
          <div className="font-mono text-base font-bold text-ink">
            {money(balance)}{' '}
            <span className="text-xs font-normal text-ink-3">{wallet?.currency ?? 'BDT'}</span>
          </div>
        </div>
        {wallet ? <Badge tone="live">Active</Badge> : <Badge tone="quiet">No wallet yet</Badge>}
      </div>

      <div>
        <span className="eyebrow !text-[10px] mb-1.5 block">
          Recent Transactions ({entries.length})
        </span>
        {entries.length === 0 ? (
          <p className="text-xs text-ink-3">No ledger entries recorded yet.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {entries.slice(0, 10).map((entry) => {
              // Amounts are signed (a debit is stored negative). The sign used to come from
              // `type === 'DEBIT'` alone, so a manual debit showed as "+৳ -25.00".
              const amount = Number(entry.amount);
              const out = amount < 0 || entry.type === 'DEBIT';
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between border-b border-rule-soft py-1.5 text-xs last:border-0"
                >
                  <div>
                    <span className="font-medium text-ink">{entry.label || entry.type}</span>
                    <span className="block font-mono text-[10px] text-ink-3">{date(entry.createdAt)}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-medium ${out ? 'text-ink' : 'text-live'}`}>
                      {out ? '−' : '+'}
                      {money(Math.abs(amount))}
                    </span>
                    <span className="block font-mono text-[10px] text-ink-3">bal: {money(entry.balanceAfter)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AdjustWallet userId={userId} balance={balance} onDone={refresh} />
    </div>
  );
}

/**
 * Credit or debit the wallet by hand: a goodwill credit after a complaint, or correcting a mistake.
 * There was no way to do this from the console; only the API offered it. Each one asks for a
 * reason (it becomes the person's ledger line and goes in the audit log) and a second click.
 */
function AdjustWallet({ userId, balance, onDone }: { userId: string; balance: number; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState<'credit' | 'debit' | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const { mutate, pending, error } = useMutation(adjustWallet);

  const value = Number(amount);
  const valid = amount.trim() !== '' && Number.isFinite(value) && value > 0 && value <= 100_000 && reason.trim().length > 0;
  const tooMuch = confirming === 'debit' && value > balance;

  const submit = async () => {
    if (!confirming) return;
    const delta = confirming === 'credit' ? value : -value;
    const result = await mutate(userId, delta, reason.trim());
    if (result !== null) {
      setDone(`${confirming === 'credit' ? 'Credited' : 'Debited'} ${money(value)}.`);
      setAmount('');
      setReason('');
      setConfirming(null);
      onDone();
    }
  };

  const inputClass =
    'w-full rounded-md border border-rule bg-white px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-[#635BFF]';

  return (
    <div className="space-y-2 border-t border-rule-soft pt-2.5">
      <span className="eyebrow !text-[10px] block">Adjust balance</span>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <label className="block">
          <span className="sr-only">Amount in taka</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={100000}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setConfirming(null);
              setDone(null);
            }}
            placeholder="Amount (৳)"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="sr-only">Reason, shown to the person</span>
          <input
            type="text"
            maxLength={120}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setDone(null);
            }}
            placeholder="Reason (they will see this)"
            className={inputClass}
          />
        </label>
      </div>

      {confirming ? (
        <div className="space-y-2 rounded-md border border-rule bg-ground p-2.5">
          <p className="text-xs text-ink">
            {confirming === 'credit' ? 'Add' : 'Take'} <strong>{money(value)}</strong> {confirming === 'credit' ? 'to' : 'from'} this
            wallet?
            {!tooMuch && (
              <>
                {' '}
                New balance: <strong>{money(confirming === 'credit' ? balance + value : balance - value)}</strong>.
              </>
            )}
          </p>
          {tooMuch && <p className="text-xs text-signal">The balance is only {money(balance)}; a debit can&apos;t go below zero.</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || tooMuch}
              onClick={submit}
              className="rounded-md bg-[#1E293B] px-3 py-1.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
            >
              {pending ? 'Saving…' : confirming === 'credit' ? `Credit ${money(value)}` : `Debit ${money(value)}`}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(null)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-2 hover:text-ink"
            >
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!valid}
            onClick={() => setConfirming('credit')}
            className="rounded-md border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-live hover:bg-ground disabled:opacity-50"
          >
            Credit
          </button>
          <button
            type="button"
            disabled={!valid || balance <= 0}
            onClick={() => setConfirming('debit')}
            className="rounded-md border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ground disabled:opacity-50"
          >
            Debit
          </button>
        </div>
      )}
      {error && <p className="text-xs text-signal">{error}</p>}
      {done && <p className="text-xs text-live">{done}</p>}
    </div>
  );
}
