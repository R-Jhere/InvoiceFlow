import { Plan } from '@prisma/client';
import { PlanLimitError } from './errors';

/**
 * Plan Limits & Enforcement
 *
 * Centralizes all free vs pro tier logic.
 * Used by services before performing plan-gated actions.
 */

export const PLAN_LIMITS = {
    FREE: {
        maxInvoicesPerMonth: 5,
        maxEmailRemindersPerInvoice: 1,
        canUseWhatsApp: false,
        canUseCustomBranding: false,
    },
    PRO: {
        maxInvoicesPerMonth: Infinity,
        maxEmailRemindersPerInvoice: Infinity,
        canUseWhatsApp: true,
        canUseCustomBranding: true,
    },
} as const;

/** Check if user can create more invoices this month */
export function checkInvoiceLimit(plan: Plan, currentMonthCount: number): void {
    const limit = PLAN_LIMITS[plan].maxInvoicesPerMonth;
    if (currentMonthCount >= limit) {
        throw new PlanLimitError(
            `Free plan allows ${limit} invoices per month. Upgrade to Pro for unlimited invoices.`
        );
    }
}

/** Check if user can send WhatsApp reminders */
export function checkWhatsAppAccess(plan: Plan): void {
    if (!PLAN_LIMITS[plan].canUseWhatsApp) {
        throw new PlanLimitError(
            'WhatsApp reminders are available on the Pro plan. Upgrade to unlock this feature.'
        );
    }
}

/** Check if user can send more email reminders for this invoice */
export function checkEmailReminderLimit(plan: Plan, currentAttempts: number): void {
    const limit = PLAN_LIMITS[plan].maxEmailRemindersPerInvoice;
    if (currentAttempts >= limit) {
        throw new PlanLimitError(
            `Free plan allows ${limit} email reminder per invoice. Upgrade to Pro for unlimited reminders.`
        );
    }
}

/** Check if user can use custom branding */
export function canUseCustomBranding(plan: Plan): boolean {
    return PLAN_LIMITS[plan].canUseCustomBranding;
}
