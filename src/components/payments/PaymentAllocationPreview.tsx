import React, { useMemo } from 'react';
import Decimal from 'decimal.js';
import { formatCurrency } from '@/utils/formatters';
import { AllocationMethod } from '@/types/payment';
import { Calculator, ArrowRight, ShieldCheck } from 'lucide-react';

interface PaymentAllocationPreviewProps {
  amount: number;
  principalOutstanding: number;
  interestOutstanding: number;
  allocationMethod?: AllocationMethod;
}

export const PaymentAllocationPreview: React.FC<PaymentAllocationPreviewProps> = ({
  amount,
  principalOutstanding,
  interestOutstanding,
  allocationMethod = 'interest_first',
}) => {
  const allocation = useMemo(() => {
    try {
      Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
      const payAmount = new Decimal(amount || 0);
      const remPrincipal = new Decimal(principalOutstanding || 0);
      const remInterest = new Decimal(interestOutstanding || 0);

      let principalPortion = new Decimal(0);
      let interestPortion = new Decimal(0);

      if (payAmount.greaterThan(0)) {
        if (allocationMethod === 'interest_first') {
          interestPortion = Decimal.min(payAmount, remInterest);
          const rem = payAmount.minus(interestPortion);
          principalPortion = Decimal.min(rem, remPrincipal);
        } else if (allocationMethod === 'principal_first') {
          principalPortion = Decimal.min(payAmount, remPrincipal);
          const rem = payAmount.minus(principalPortion);
          interestPortion = Decimal.min(rem, remInterest);
        } else {
          // Proportional
          const sumOutstanding = remPrincipal.plus(remInterest);
          if (sumOutstanding.isZero()) {
            principalPortion = payAmount;
          } else {
            const pRatio = remPrincipal.dividedBy(sumOutstanding);
            principalPortion = Decimal.min(payAmount.times(pRatio), remPrincipal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            interestPortion = payAmount.minus(principalPortion);
          }
        }
      }

      const newPrincipal = Decimal.max(0, remPrincipal.minus(principalPortion)).toNumber();
      const newInterest = Decimal.max(0, remInterest.minus(interestPortion)).toNumber();
      const newTotal = newPrincipal + newInterest;

      return {
        principalPortion: principalPortion.toNumber(),
        interestPortion: interestPortion.toNumber(),
        newPrincipal,
        newInterest,
        newTotal,
        isSettlement: newTotal === 0 && payAmount.greaterThan(0),
      };
    } catch {
      return {
        principalPortion: 0,
        interestPortion: 0,
        newPrincipal: principalOutstanding,
        newInterest: interestOutstanding,
        newTotal: principalOutstanding + interestOutstanding,
        isSettlement: false,
      };
    }
  }, [amount, principalOutstanding, interestOutstanding, allocationMethod]);

  if (!amount || amount <= 0) return null;

  return (
    <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-indigo-400" /> Allocation Breakdown Preview
        </span>
        <span className="text-xs text-indigo-300 font-medium">
          Strategy: {allocationMethod.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
          <p className="text-[10px] uppercase font-semibold text-emerald-400">Interest Portion</p>
          <p className="text-sm font-bold text-emerald-300 mt-0.5">{formatCurrency(allocation.interestPortion)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Bal: {formatCurrency(interestOutstanding)} <ArrowRight className="w-2.5 h-2.5 inline" /> {formatCurrency(allocation.newInterest)}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
          <p className="text-[10px] uppercase font-semibold text-indigo-400">Principal Portion</p>
          <p className="text-sm font-bold text-indigo-200 mt-0.5">{formatCurrency(allocation.principalPortion)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Bal: {formatCurrency(principalOutstanding)} <ArrowRight className="w-2.5 h-2.5 inline" /> {formatCurrency(allocation.newPrincipal)}
          </p>
        </div>
      </div>

      {allocation.isSettlement && (
        <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Full Settlement Payment (Remaining Balance: ₹0)
        </div>
      )}
    </div>
  );
};

export default PaymentAllocationPreview;
