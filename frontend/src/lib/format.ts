export const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
export const km = (n: number) => `${n.toLocaleString()} km`;
export const kg = (n: number) => `${n.toLocaleString()} kg`;
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
export const daysUntil = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
