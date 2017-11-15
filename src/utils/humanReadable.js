export const price = (number) => number.toLocaleString(navigator.language, {
  style: 'currency',
  currency: 'EUR'
});
export const percentage = (percent) => percent.toLocaleString(navigator.language, {
  style: 'percent',
  maximumFractionDigits: 0
});
export const distance = (dist) => `${(dist).toLocaleString(navigator.language, {
  style: 'decimal',
  maximumFractionDigits: 0
})}mm`;
export const degrees = (rad) => `${(rad * 360 / (Math.PI * 2)).toLocaleString(navigator.language, {
  style: 'decimal',
  maximumFractionDigits: 0
})}°`;
