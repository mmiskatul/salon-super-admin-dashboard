'use client';

import { useApi } from '@/lib/useApi';
import { getLoyaltyFor, type LoyaltyAccount } from '@/lib/api/loyalty';
import { date } from '@/lib/format';
import { Badge } from './primitives';

/** A customer's loyalty points balance and recent history — GET /loyalty/:userId is
 *  SUPER_ADMIN-only, added specifically so this console can look this up (previously self-service
 *  only). Not every account has one — a barber or owner who never booked as a customer won't. */
export default function LoyaltyPanel({ userId }: { userId: string }) {
  const loyalty = useApi<LoyaltyAccount | null>(
    () => (userId && userId !== 'undefined' && userId !== 'null' ? getLoyaltyFor(userId) : Promise.resolve(null)),
    [userId],
    'loyalty-account',
  );

  if (loyalty.loading) {
    return (
      <div className="rounded-lg border border-rule bg-surface p-3 text-xs text-ink-3">
        Loading loyalty information…
      </div>
    );
  }

  if (loyalty.error || !loyalty.data) {
    return (
      <div className="rounded-lg border border-rule bg-ground p-3 text-xs text-ink-3">
        No loyalty account for this user.
      </div>
    );
  }

  const rawAccount = loyalty.data;
  const account =
    rawAccount && typeof rawAccount === 'object' && 'data' in rawAccount && (rawAccount as any).data
      ? (rawAccount as any).data
      : rawAccount;

  if (loyalty.error || !account) {
    return (
      <div className="rounded-lg border border-rule bg-ground p-3 text-xs text-ink-3">
        No loyalty account for this user.
      </div>
    );
  }

  const rawTx = account.recentTransactions;
  const recentTransactions: any[] = Array.isArray(rawTx)
    ? rawTx
    : Array.isArray((account as any)?.transactions)
    ? (account as any).transactions
    : [];

  return (
    <div className="space-y-3 rounded-lg border border-rule bg-surface p-3">
      <div className="flex items-center justify-between border-b border-rule-soft pb-2">
        <div>
          <span className="eyebrow !text-[10px]">Loyalty Points</span>
          <div className="font-mono text-base font-bold text-ink">{account.points ?? 0}</div>
        </div>
        <Badge tone="live">Active</Badge>
      </div>

      <div>
        <span className="eyebrow !text-[10px] mb-1.5 block">
          Recent Activity ({recentTransactions.length})
        </span>
        {recentTransactions.length === 0 ? (
          <p className="text-xs text-ink-3">No points activity recorded yet.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {recentTransactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between border-b border-rule-soft py-1.5 text-xs last:border-0"
              >
                <div>
                  <span className="font-medium text-ink">{tx.description || tx.type}</span>
                  <span className="block font-mono text-[10px] text-ink-3">{date(tx.createdAt)}</span>
                </div>
                <span className={`font-mono font-medium ${tx.points >= 0 ? 'text-live' : 'text-ink'}`}>
                  {tx.points >= 0 ? '+' : ''}
                  {tx.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
