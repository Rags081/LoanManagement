import { Decimal } from 'decimal.js';

// Configure precision and rounding globally
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
});

export { Decimal };
export default Decimal;
