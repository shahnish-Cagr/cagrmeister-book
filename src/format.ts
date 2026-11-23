const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Indian grouping: last three digits, then pairs. */
export function group(n: number, digits: number): string {
  const neg = n < 0;
  const [whole, frac] = Math.abs(n).toFixed(digits).split(".");
  let int = whole ?? "0";
  if (int.length > 3) {
    const head = int.slice(0, -3);
    const tail = int.slice(-3);
    const parts: string[] = [];
    let rest = head;
    while (rest.length > 2) {
      parts.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) parts.unshift(rest);
    int = `${parts.join(",")},${tail}`;
  }
  const body = digits > 0 ? `${int}.${frac}` : int;
  return neg ? `-${body}` : body;
}

export function inr(n: number): string {
  return group(n, 2);
}

export function qty(n: number): string {
  return group(n, 2);
}

/** Prices are quoted to two decimals. Cost stays exact in its own column. */
export function px(n: number): string {
  return group(n, 2);
}

export function pct(n: number, digits = 2): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}
