// Real-time cloud cost estimation.
// Each service has "periods" ({start, end|null}) when it was running.
// Cost so far = hours running inside the current month × hourly price.

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export const PROVIDERS = ["AWS", "GCP", "Azure", "Vercel", "DigitalOcean", "Cloudflare", "Outro"];

export function monthBounds(now = Date.now()) {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  return { start, end, hours: (end - start) / HOUR, days: Math.round((end - start) / DAY) };
}

// Monthly plans are spread evenly over the hours of the month.
export function hourlyCost(service, bounds) {
  const rate = Number(service.rate) || 0;
  return service.billing === "hourly" ? rate : rate / bounds.hours;
}

export const isRunning = (s) => s.periods.length > 0 && s.periods.at(-1).end === null;

// Cost accumulated from the start of the month until timestamp t.
// A running period (end === null) is treated as "still on", so a future t gives a projection.
export function spentUntil(service, bounds, t) {
  const limit = Math.min(t, bounds.end);
  let ms = 0;
  for (const p of service.periods) {
    const from = Math.max(p.start, bounds.start);
    const to = Math.min(p.end ?? Infinity, limit);
    if (to > from) ms += to - from;
  }
  return (ms / HOUR) * hourlyCost(service, bounds);
}

export function cloudTotals(services, now = Date.now()) {
  const bounds = monthBounds(now);
  const spent = services.reduce((a, s) => a + spentUntil(s, bounds, now), 0);
  const projected = services.reduce((a, s) => a + spentUntil(s, bounds, bounds.end), 0);
  const perHour = services
    .filter(isRunning)
    .reduce((a, s) => a + hourlyCost(s, bounds), 0);
  return { bounds, spent, projected, perHour, perSecond: perHour / 3600 };
}

// One point per day: real accumulated cost until now, projection after now.
export function dailySeries(services, now = Date.now()) {
  const bounds = monthBounds(now);
  const total = (t) => services.reduce((a, s) => a + spentUntil(s, bounds, t), 0);
  const today = Math.floor((now - bounds.start) / DAY) + 1;
  return Array.from({ length: bounds.days }, (_, i) => {
    const day = i + 1;
    const endOfDay = bounds.start + day * DAY;
    return {
      day,
      real: day <= today ? total(Math.min(endOfDay, now)) : null,
      // start the projection at "today" so both lines connect
      proj: day >= today ? total(day === today ? now : endOfDay) : null,
    };
  });
}
