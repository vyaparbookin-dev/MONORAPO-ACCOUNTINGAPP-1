export const MONEY_PRECISION = 2;

export const roundToDecimal = (value, decimals = MONEY_PRECISION) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid monetary value: ${value}`);
  }

  const factor = 10 ** decimals;

  return Math.round((number + Number.EPSILON) * factor) / factor;
};

export const roundMoney = (value) => roundToDecimal(value, MONEY_PRECISION);

export const roundToNearestInteger = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid monetary value: ${value}`);
  }

  return Math.round(number);
};

export const calculateRoundOff = (value) => {
  const amount = roundMoney(value);
  return roundMoney(roundToNearestInteger(amount) - amount);
};