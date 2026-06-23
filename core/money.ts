// USDC has 6 decimals. We work in integer base units (1 unit = 1e-6 USDC)
// everywhere money is concerned — floats are only for sub-unit accrual.
export const USDC_DECIMALS = 6;
export const ONE_USDC = 10 ** USDC_DECIMALS;

/** Dollars → integer USDC base units. usdc(0.000124) === 124 */
export const usdc = (dollars: number) => Math.round(dollars * ONE_USDC);

/** Integer base units → display string. formatUSDC(12400) === "$0.012400" */
export const formatUSDC = (units: number, dp = 6) =>
  `$${(units / ONE_USDC).toFixed(dp)}`;
