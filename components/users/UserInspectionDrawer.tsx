'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Store,
  ShieldAlert,
  ShieldCheck,
  Clock,
  User,
  Calendar,
  Mail,
  Phone,
  BellRing,
  ArrowUpRight,
  Scissors,
  Crown,
  Briefcase,
} from 'lucide-react';
import type { PlatformUser } from '@/lib/api/users';
import { date, initials, since } from '@/lib/format';
import { UserRoleBadge } from '@/app/users/page';

interface UserInspectionDrawerProps {
  user: PlatformUser | null;
  shopName?: string | null;
  onClose: () => void;
  onBanClick: (user: PlatformUser) => void;
  onUnbanClick: (user: PlatformUser) => void;
}

export function UserInspectionDrawer({
  user,
  shopName,
  onClose,
  onBanClick,
  onUnbanClick,
}: UserInspectionDrawerProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (user) {
      document.addEventListener('keydown', handleKeyDown);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [user, onClose]);

  if (!user) return null;

  const displayName = user.name || user.email.split('@')[0];
  const isCustomer = (user.role || '').toUpperCase() === 'CUSTOMER';
  const isOwner = (user.role || '').toUpperCase() === 'OWNER';
  const isBarber =
    (user.role || '').toUpperCase() === 'BARBER' || (user.role || '').toUpperCase() === 'STAFF';

  const profileHref = isCustomer
    ? `/customers/${encodeURIComponent(user.id)}`
    : isOwner
    ? `/owners/${encodeURIComponent(user.id)}`
    : isBarber
    ? `/barbers/${encodeURIComponent(user.id)}`
    : `/users/${encodeURIComponent(user.id)}`;

  const profileLabel = isCustomer
    ? 'Customer 360 Dossier'
    : isOwner
    ? 'Shop Owner Command'
    : isBarber
    ? 'Stylist Portfolio'
    : 'User Profile';

  function copyId() {
    if (!user) return;
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-manrope">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#E2E8F0] transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="border-b border-[#F1F5F9] px-6 py-5 bg-[#FAFBFD]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#635BFF]">
                Account Quick Inspector
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Identity Banner */}
            <div className="mt-4 flex items-center gap-4">
              <div className="relative">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#EEF2FF] to-[#E0E7FF] text-[18px] font-black text-[#635BFF] border-2 border-[#CBD5E1] shadow-xs">
                  {initials(user.name || user.email)}
                </span>
                <span
                  className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                    user.isBanned
                      ? 'bg-[#EF4444]'
                      : user.emailVerified
                      ? 'bg-[#16A34A]'
                      : 'bg-[#F59E0B]'
                  }`}
                  title={user.isBanned ? 'Banned' : user.emailVerified ? 'Verified' : 'Unverified'}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-extrabold text-[#1E293B]">{displayName}</h2>
                <p className="truncate text-[12px] font-medium text-[#64748B]">{user.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <UserRoleBadge role={user.role} />
                  {user.isBanned ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">
                      <ShieldAlert className="h-3 w-3" /> Suspended
                    </span>
                  ) : user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">
                      <Clock className="h-3 w-3" /> Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Account ID card with 1-click copy */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  User Unique Identifier
                </span>
                <span className="block truncate font-mono text-[12px] font-semibold text-[#1E293B]">
                  {user.id}
                </span>
              </div>
              <button
                type="button"
                onClick={copyId}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#64748B] hover:text-[#1E293B] hover:border-[#CBD5E1] transition-all cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Banned Alert Banner if account is suspended */}
            {user.isBanned && (
              <div className="rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-[12px] text-[#9F1239]">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <ShieldAlert className="h-4 w-4 text-[#E11D48]" />
                  <span>Account Suspended / Banned</span>
                </div>
                {user.bannedReason ? (
                  <p className="mt-1 font-medium text-[#BE123C]">
                    Reason: <span className="font-semibold">"{user.bannedReason}"</span>
                  </p>
                ) : (
                  <p className="mt-1 font-medium text-[#BE123C]">
                    No specific ban reason provided.
                  </p>
                )}
                {user.bannedAt && (
                  <p className="mt-1 text-[11px] text-[#9F1239]">
                    Suspended on {date(user.bannedAt)} ({since(user.bannedAt)})
                  </p>
                )}
              </div>
            )}

            {/* Key Information Sections */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                Account Metadata
              </h4>

              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <span className="block text-[10px] font-bold uppercase text-[#94A3B8]">Joined</span>
                  <span className="mt-0.5 block font-bold text-[#1E293B]">{date(user.createdAt)}</span>
                  <span className="text-[11px] text-[#64748B]">{since(user.createdAt)}</span>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <span className="block text-[10px] font-bold uppercase text-[#94A3B8]">
                    Last Updated
                  </span>
                  <span className="mt-0.5 block font-bold text-[#1E293B]">{date(user.updatedAt)}</span>
                  <span className="text-[11px] text-[#64748B]">{since(user.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Salon Affiliation */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                Salon / Tenant Affiliation
              </h4>

              {user.tenantId ? (
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0284C7] shrink-0">
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-bold text-[#1E293B] text-[13px] truncate">
                        {shopName || 'Affiliated Salon'}
                      </p>
                      <p className="text-[11px] font-mono text-[#94A3B8] truncate">{user.tenantId}</p>
                    </div>
                  </div>
                  <Link
                    href={`/shops/${encodeURIComponent(user.tenantId)}`}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-1 text-[11px] font-bold text-[#0284C7] hover:bg-[#E0F2FE] transition-colors"
                  >
                    <span>Shop</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] p-3.5 text-[12px] text-[#64748B]">
                  <p className="font-semibold text-[#1E293B]">
                    {user.role === 'BARBER'
                      ? 'Individual Barber'
                      : user.role === 'OWNER'
                      ? 'Owner (No shop registered yet)'
                      : 'Individual Customer Account'}
                  </p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    Not currently linked to any specific tenant or salon premises.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Operator Shortcuts */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                Operator Shortcuts
              </h4>

              <div className="space-y-2">
                <Link
                  href={profileHref}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-3 text-[12px] font-bold text-[#1E293B] hover:border-[#635BFF] hover:text-[#635BFF] transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#64748B] group-hover:text-[#635BFF]" />
                    {profileLabel}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#635BFF]" />
                </Link>

                <Link
                  href={`/notify?userId=${encodeURIComponent(user.id)}`}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-3 text-[12px] font-bold text-[#1E293B] hover:border-[#635BFF] hover:text-[#635BFF] transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-[#64748B] group-hover:text-[#635BFF]" />
                    Send Push / Email Notification
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#635BFF]" />
                </Link>
              </div>
            </div>
          </div>

          {/* Drawer Footer Moderation Bar */}
          <div className="border-t border-[#F1F5F9] bg-[#FAFBFD] p-5 flex items-center justify-between gap-3">
            <Link
              href={profileHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-[12px] font-bold text-[#1E293B] hover:bg-[#F8FAFC] transition-colors"
            >
              <span>Full Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            {user.role !== 'SUPER_ADMIN' && (
              <>
                {user.isBanned ? (
                  <button
                    type="button"
                    onClick={() => onUnbanClick(user)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-[#15803D] transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Reactivate / Unban</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onBanClick(user)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#EF4444] px-4 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-[#DC2626] transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Ban Account</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
