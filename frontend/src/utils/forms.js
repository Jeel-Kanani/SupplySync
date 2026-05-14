export const toNumberOrZero = (value) => {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  return Number(value);
};

export const splitLines = (value) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
