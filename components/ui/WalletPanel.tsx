'use client';

import { useApi } from '@/lib/useApi';
import { getUserWallet, getUserWalletEntries, type UserWallet, type UserWalletEntry } from '@/lib/api/users';
import { date, money } from '@/lib/format';
import { Badge } from './primitives';

/** A user's digital wallet balance and recent ledger entries — reused wherever an operator needs
 *  to inspect one account's money, whether reached from the Users roster or a barber's own detail
 *  view (a barber is a User, so the same wallet endpoints apply). */
export default function WalletPanel({ userId }: { userId: string }) {
  const walletApi = useApi(() => (userId ? getUserWallet(userId) : Promise.resolve(null)), [userId]);
  const entriesApi = useApi(() => (userId ? getUserWalletEntries(userId) : Promise.resolve([])), [userId]);

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

  if (walletApi.error || (!wallet && entries.length === 0)) {
    return (
      <div className="rounded-lg border border-rule bg-ground p-3 text-xs text-ink-3">
        No active wallet registered for this user account.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-rule bg-surface p-3">
      <div className="flex items-center justify-between border-b border-rule-soft pb-2">
        <div>
          <span className="eyebrow !text-[10px]">Digital Wallet</span>
          <div className="font-mono text-base font-bold text-ink">
            {money(wallet?.balance ?? 0)}{' '}
            <span className="text-xs font-normal text-ink-3">{wallet?.currency ?? 'BDT'}</span>
          </div>
        </div>
        <Badge tone="live">Active</Badge>
      </div>

      <div>
        <span className="eyebrow !text-[10px] mb-1.5 block">
          Recent Transactions ({entries.length})
        </span>
        {entries.length === 0 ? (
          <p className="text-xs text-ink-3">No ledger entries recorded yet.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {entries.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-rule-soft py-1.5 text-xs last:border-0"
              >
                <div>
                  <span className="font-medium text-ink">{entry.label || entry.type}</span>
                  <span className="block font-mono text-[10px] text-ink-3">
                    {date(entry.createdAt)}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono font-medium ${
                      entry.type === 'CREDIT' || entry.type === 'REFUND' || entry.type === 'TOP_UP'
                        ? 'text-live'
                        : 'text-ink'
                    }`}
                  >
                    {entry.type === 'DEBIT' ? '-' : '+'}
                    {money(entry.amount)}
                  </span>
                  <span className="block font-mono text-[10px] text-ink-3">
                    bal: {money(entry.balanceAfter)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
