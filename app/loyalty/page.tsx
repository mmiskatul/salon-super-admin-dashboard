'use client';

import React, { useState } from 'react';
import {
  Award,
  Coins,
  Edit2,
  Gift,
  HelpCircle,
  Plus,
  RotateCw,
  Sliders,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import {
  addLoyaltyReward,
  deleteLoyaltyReward,
  getLoyaltyConfig,
  type LoyaltyProgramConfig,
  type LoyaltyRewardItem,
  updateLoyaltyConfig,
  updateLoyaltyReward,
} from '@/lib/api/loyalty';
import { count, money, since } from '@/lib/format';
import {
  Badge,
  Button,
  Canvas,
  Empty,
  Failed,
  Loading,
  PageHead,
  Panel,
  Stat,
} from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Field, FormError, Modal, Select, TextInput } from '@/components/ui/Form';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const ICON_OPTIONS = [
  { value: 'wallet-outline', label: 'Wallet (wallet-outline)' },
  { value: 'cash-outline', label: 'Cash (cash-outline)' },
  { value: 'card-outline', label: 'Card (card-outline)' },
  { value: 'diamond-outline', label: 'Diamond (diamond-outline)' },
  { value: 'gift-outline', label: 'Gift (gift-outline)' },
  { value: 'trophy-outline', label: 'Trophy (trophy-outline)' },
];

export default function LoyaltyPage() {
  const loyaltyConfig = useApi(() => getLoyaltyConfig(), [], 'loyalty-config');

  // Program Rules Modal State
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesForm, setRulesForm] = useState({
    pointsPerCurrencyUnit: 1,
    pointRedemptionValue: 0.01,
    minRedemptionPoints: 1000,
  });
  const [rulesPending, setRulesPending] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  // Reward Tier Modal State (Create / Edit)
  const [rewardOpen, setRewardOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyRewardItem | null>(null);
  const [rewardForm, setRewardForm] = useState({
    id: '',
    title: '',
    pointsRequired: 1000,
    creditAmount: 10,
    icon: 'wallet-outline',
    description: 'Redeem points for wallet credit',
  });
  const [rewardPending, setRewardPending] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    reward: LoyaltyRewardItem | null;
    pending: boolean;
    error: string | null;
  }>({
    open: false,
    reward: null,
    pending: false,
    error: null,
  });

  const config = loyaltyConfig.data;
  const rewards = config?.rewards ?? [];

  // Open Rules Modal
  function handleOpenRules() {
    if (!config) return;
    setRulesForm({
      pointsPerCurrencyUnit: config.pointsPerCurrencyUnit,
      pointRedemptionValue: config.pointRedemptionValue,
      minRedemptionPoints: config.minRedemptionPoints,
    });
    setRulesError(null);
    setRulesOpen(true);
  }

  // Submit Rules
  async function handleSaveRules(e: React.FormEvent) {
    e.preventDefault();
    setRulesPending(true);
    setRulesError(null);
    try {
      await updateLoyaltyConfig({
        pointsPerCurrencyUnit: Number(rulesForm.pointsPerCurrencyUnit),
        pointRedemptionValue: Number(rulesForm.pointRedemptionValue),
        minRedemptionPoints: Number(rulesForm.minRedemptionPoints),
      });
      await loyaltyConfig.refresh();
      setRulesOpen(false);
    } catch (err: any) {
      setRulesError(err?.message || 'Failed to update program rules');
    } finally {
      setRulesPending(false);
    }
  }

  // Open Add Reward Modal
  function handleOpenAddReward() {
    setEditingReward(null);
    setRewardForm({
      id: '',
      title: '',
      pointsRequired: 1000,
      creditAmount: 10,
      icon: 'wallet-outline',
      description: 'Redeem points for wallet credit',
    });
    setRewardError(null);
    setRewardOpen(true);
  }

  // Open Edit Reward Modal
  function handleOpenEditReward(item: LoyaltyRewardItem) {
    setEditingReward(item);
    setRewardForm({
      id: item.id,
      title: item.title,
      pointsRequired: item.pointsRequired,
      creditAmount: item.creditAmount,
      icon: item.icon || 'wallet-outline',
      description: item.description || 'Redeem points for wallet credit',
    });
    setRewardError(null);
    setRewardOpen(true);
  }

  // Submit Reward Tier (Add or Edit)
  async function handleSaveReward(e: React.FormEvent) {
    e.preventDefault();
    setRewardPending(true);
    setRewardError(null);
    try {
      if (editingReward) {
        await updateLoyaltyReward(editingReward.id, {
          title: rewardForm.title,
          pointsRequired: Number(rewardForm.pointsRequired),
          creditAmount: Number(rewardForm.creditAmount),
          icon: rewardForm.icon,
          description: rewardForm.description,
        });
      } else {
        await addLoyaltyReward({
          id: rewardForm.id.trim() || undefined,
          title: rewardForm.title,
          pointsRequired: Number(rewardForm.pointsRequired),
          creditAmount: Number(rewardForm.creditAmount),
          icon: rewardForm.icon,
          description: rewardForm.description,
        });
      }
      await loyaltyConfig.refresh();
      setRewardOpen(false);
    } catch (err: any) {
      setRewardError(err?.message || 'Failed to save reward tier');
    } finally {
      setRewardPending(false);
    }
  }

  // Prompt Delete
  function handlePromptDelete(reward: LoyaltyRewardItem) {
    setDeleteConfirm({
      open: true,
      reward,
      pending: false,
      error: null,
    });
  }

  // Confirm Delete
  async function handleConfirmDelete() {
    if (!deleteConfirm.reward) return;
    setDeleteConfirm((prev) => ({ ...prev, pending: true, error: null }));
    try {
      await deleteLoyaltyReward(deleteConfirm.reward.id);
      await loyaltyConfig.refresh();
      setDeleteConfirm((prev) => ({ ...prev, open: false, pending: false }));
    } catch (err: any) {
      setDeleteConfirm((prev) => ({
        ...prev,
        pending: false,
        error: err?.message || 'Failed to delete reward tier',
      }));
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="Loyalty & rewards program"
        lede="Platform-wide loyalty point rules and wallet credit reward tiers. Configure earning rates, point conversion values, and customer catalog options."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenRules} variant="outline" disabled={!config || loyaltyConfig.loading}>
              <Sliders size={12} />
              Edit Program Rules
            </Button>
            <Button onClick={handleOpenAddReward} variant="primary" disabled={!config || loyaltyConfig.loading}>
              <Plus size={12} />
              Add Reward Tier
            </Button>
            <Button onClick={loyaltyConfig.refresh} disabled={loyaltyConfig.loading}>
              <RotateCw size={12} className={loyaltyConfig.loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {loyaltyConfig.error && <Failed message={loyaltyConfig.error} onRetry={loyaltyConfig.refresh} />}
        {loyaltyConfig.loading && !loyaltyConfig.data && <Loading label="Loading loyalty program configuration" />}

        {config && !loyaltyConfig.error && (
          <>
            {/* Metric / Stat Overview */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label="Earn rate"
                value={`1 BDT = ${config.pointsPerCurrencyUnit} pt`}
                tone="plain"
                sub="Points credited per spend"
              />
              <Stat
                label="Point redemption value"
                value={`1 pt = ৳${config.pointRedemptionValue}`}
                tone="live"
                sub={`1,000 pts = ৳${(1000 * config.pointRedemptionValue).toFixed(0)}`}
              />
              <Stat
                label="Min. redemption"
                value={`${count(config.minRedemptionPoints)} pts`}
                tone="plain"
                sub={`Minimum threshold (৳${(config.minRedemptionPoints * config.pointRedemptionValue).toFixed(0)})`}
              />
              <Stat
                label="Active reward tiers"
                value={count(rewards.length)}
                tone="live"
                sub={`Last updated ${since(config.updatedAt)}`}
              />
            </div>

            {/* Quick Conversion Reference Banner */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1E293B]">Live Customer Conversion Rates</h3>
                    <p className="text-[12px] text-[#64748B] font-medium">
                      Based on current conversion rate (1 pt = ৳{config.pointRedemptionValue}):
                      {' '}
                      <span className="font-semibold text-[#1E293B]">1,000 pts = ৳10</span>
                      {' • '}
                      <span className="font-semibold text-[#1E293B]">3,000 pts = ৳30</span>
                      {' • '}
                      <span className="font-semibold text-[#1E293B]">5,000 pts = ৳50</span>
                      {' • '}
                      <span className="font-semibold text-[#1E293B]">10,000 pts = ৳100</span>
                    </p>
                  </div>
                </div>
                <Button onClick={handleOpenRules} variant="outline" className="shrink-0 self-start sm:self-auto">
                  <Sliders size={12} />
                  Modify Rules
                </Button>
              </div>
            </div>

            {/* Reward Tiers Catalog Table */}
            <Panel
              flush
              title={`Reward Catalog (${count(rewards.length)} tier${rewards.length === 1 ? '' : 's'})`}
              actions={
                <Button onClick={handleOpenAddReward} variant="primary" className="text-xs">
                  <Plus size={12} />
                  New Tier
                </Button>
              }
            >
              {rewards.length === 0 ? (
                <div className="p-8">
                  <Empty
                    title="No reward tiers configured"
                    hint="Click 'New Tier' to add customer redemption options."
                  />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Reward Tier</Th>
                        <Th>Points Required</Th>
                        <Th>Wallet Credit</Th>
                        <Th>Effective Value</Th>
                        <Th>Icon</Th>
                        <Th>Description</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewards.map((reward) => {
                        const effectiveRate = reward.creditAmount / reward.pointsRequired;
                        return (
                          <Tr key={reward.id}>
                            <Td>
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#635BFF] border border-indigo-100">
                                  <Wallet size={15} />
                                </div>
                                <div>
                                  <span className="font-bold text-[#1E293B] block">{reward.title}</span>
                                  <span className="text-[11px] text-[#94A3B8] font-mono">{reward.id}</span>
                                </div>
                              </div>
                            </Td>
                            <Td>
                              <Badge tone="live">
                                {count(reward.pointsRequired)} pts
                              </Badge>
                            </Td>
                            <Td>
                              <span className="font-bold text-[#1E293B]">
                                {money(reward.creditAmount)}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-xs text-[#64748B] font-mono">
                                ৳{effectiveRate.toFixed(4)} / pt
                              </span>
                            </Td>
                            <Td>
                              <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-mono text-[#475569]">
                                {reward.icon || 'wallet-outline'}
                              </span>
                            </Td>
                            <Td>
                              <span className="text-xs text-[#64748B] max-w-[220px] truncate block" title={reward.description}>
                                {reward.description || 'Redeem points for wallet credit'}
                              </span>
                            </Td>
                            <Td align="right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReward(reward)}
                                  className="p-1.5 text-[#64748B] hover:text-[#635BFF] hover:bg-[#EEF2FF] rounded-lg transition-colors cursor-pointer"
                                  title="Edit Tier"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePromptDelete(reward)}
                                  className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                                  title="Delete Tier"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Scroll>
              )}
            </Panel>
          </>
        )}
      </Canvas>

      {/* Program Rules Modal */}
      {rulesOpen && (
        <Modal
          title="Edit Loyalty Program Rules"
          note="Configure global earning parameters and point redemption ratios applied to customer balances."
          onClose={rulesPending ? () => {} : () => setRulesOpen(false)}
        >
          <form onSubmit={handleSaveRules} className="space-y-4">
            <Field
              label="Points per Currency Unit (BDT)"
              hint="How many points a customer earns for every 1 BDT spent on completed appointments (e.g. 1.0 = 1 pt / ৳1)."
            >
              <TextInput
                type="number"
                step="0.01"
                min="0.01"
                required
                value={rulesForm.pointsPerCurrencyUnit}
                onChange={(e) =>
                  setRulesForm((prev) => ({ ...prev, pointsPerCurrencyUnit: Number(e.target.value) }))
                }
              />
            </Field>

            <Field
              label="Point Redemption Value (BDT per 1 Point)"
              hint="The cash equivalent of 1 loyalty point (e.g. 0.01 means 1,000 points = ৳10, 5,000 points = ৳50, 10,000 points = ৳100)."
            >
              <TextInput
                type="number"
                step="0.0001"
                min="0.0001"
                required
                value={rulesForm.pointRedemptionValue}
                onChange={(e) =>
                  setRulesForm((prev) => ({ ...prev, pointRedemptionValue: Number(e.target.value) }))
                }
              />
            </Field>

            <div className="rounded-lg bg-[#F8F9FE] border border-[#E2E8F0] p-3 text-xs text-[#475569]">
              <span className="font-bold text-[#1E293B]">Live Calculation Preview:</span>
              <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                <span>1,000 points = <strong>৳{(1000 * rulesForm.pointRedemptionValue).toFixed(2)}</strong></span>
                <span>3,000 points = <strong>৳{(3000 * rulesForm.pointRedemptionValue).toFixed(2)}</strong></span>
                <span>5,000 points = <strong>৳{(5000 * rulesForm.pointRedemptionValue).toFixed(2)}</strong></span>
                <span>10,000 points = <strong>৳{(10000 * rulesForm.pointRedemptionValue).toFixed(2)}</strong></span>
              </div>
            </div>

            <Field
              label="Minimum Points Threshold"
              hint="Minimum balance a customer must possess before being allowed to redeem (default 1,000 pts)."
            >
              <TextInput
                type="number"
                step="1"
                min="1"
                required
                value={rulesForm.minRedemptionPoints}
                onChange={(e) =>
                  setRulesForm((prev) => ({ ...prev, minRedemptionPoints: Number(e.target.value) }))
                }
              />
            </Field>

            {rulesError && <FormError message={rulesError} />}

            <div className="flex items-center justify-end gap-2 border-t border-[#E2E8F0] pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={rulesPending}
                onClick={() => setRulesOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={rulesPending}>
                {rulesPending ? 'Saving...' : 'Save Program Rules'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Reward Tier Modal */}
      {rewardOpen && (
        <Modal
          title={editingReward ? `Edit Reward: ${editingReward.title}` : 'Add New Reward Tier'}
          note="Define a wallet credit reward that customers can redeem with their loyalty points."
          onClose={rewardPending ? () => {} : () => setRewardOpen(false)}
        >
          <form onSubmit={handleSaveReward} className="space-y-4">
            {!editingReward && (
              <Field
                label="Tier Identifier (Optional)"
                hint="Unique internal ID (e.g. wallet-1000). If left blank, one will be generated automatically."
              >
                <TextInput
                  type="text"
                  placeholder="wallet-1000"
                  value={rewardForm.id}
                  onChange={(e) => setRewardForm((prev) => ({ ...prev, id: e.target.value }))}
                />
              </Field>
            )}

            <Field
              label="Reward Title"
              hint="User-facing title shown in the customer app (e.g. BDT 10 Wallet Credit)."
            >
              <TextInput
                type="text"
                required
                placeholder="BDT 10 Wallet Credit"
                value={rewardForm.title}
                onChange={(e) => setRewardForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Points Required"
                hint="Points deducted from the customer's balance."
              >
                <TextInput
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={rewardForm.pointsRequired}
                  onChange={(e) => {
                    const pts = Number(e.target.value);
                    const defaultCredit = config ? Math.round(pts * config.pointRedemptionValue) : pts * 0.01;
                    setRewardForm((prev) => ({
                      ...prev,
                      pointsRequired: pts,
                      // Automatically propose matching credit if adding new
                      creditAmount: !editingReward ? defaultCredit : prev.creditAmount,
                    }));
                  }}
                />
              </Field>

              <Field
                label="Wallet Credit Amount (BDT)"
                hint="Actual BDT credited to customer's in-app wallet."
              >
                <TextInput
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={rewardForm.creditAmount}
                  onChange={(e) =>
                    setRewardForm((prev) => ({ ...prev, creditAmount: Number(e.target.value) }))
                  }
                />
              </Field>
            </div>

            <Field
              label="Icon"
              hint="Icon used in customer mobile app cards."
            >
              <Select
                value={rewardForm.icon}
                onChange={(e) => setRewardForm((prev) => ({ ...prev, icon: e.target.value }))}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Description"
              hint="Short description for customer app (e.g. Redeem points for wallet credit)."
            >
              <TextInput
                type="text"
                value={rewardForm.description}
                onChange={(e) => setRewardForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Field>

            {rewardError && <FormError message={rewardError} />}

            <div className="flex items-center justify-end gap-2 border-t border-[#E2E8F0] pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={rewardPending}
                onClick={() => setRewardOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={rewardPending}>
                {rewardPending ? 'Saving...' : editingReward ? 'Update Tier' : 'Create Tier'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Reward Tier Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Reward Tier"
        description={
          <>
            Are you sure you want to delete the reward tier{' '}
            <strong>{deleteConfirm.reward?.title}</strong> ({deleteConfirm.reward?.pointsRequired} points)?
            <br />
            Customers will no longer be able to select or redeem this tier.
          </>
        }
        confirmLabel="Delete Tier"
        variant="danger"
        pending={deleteConfirm.pending}
        error={deleteConfirm.error}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
