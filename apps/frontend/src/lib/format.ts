export function formatDateFi(date: Date) {
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatEuro(value: number) {
  return value.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
