import { formatDate } from "@/core/date";
import type { DayStat } from "../stats";
import s from "./sport.module.css";

/** Saubere Achsenschritte (1, 2, 2.5, 5 × 10^n). */
function niceStep(range: number, ticks = 4): number {
  const raw = range / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

/** Linienchart: schwerster Satz pro Trainingstag (oder max. Wiederholungen ohne Gewicht). */
export function ProgressChart({ stats }: { stats: DayStat[] }) {
  const weighted = stats.some((d) => d.bestWeight !== null);
  const points = stats.map((d) => ({ day: d.day, v: weighted ? d.bestWeight ?? 0 : d.bestReps }));
  if (points.length < 2) {
    return <p className="small">Ab zwei Trainingstagen mit dieser Übung erscheint hier der Verlauf.</p>;
  }

  const W = 640, H = 240, L = 44, R = 16, T = 16, B = 32;
  const vals = points.map((p) => p.v);
  const lo0 = Math.min(...vals), hi0 = Math.max(...vals);
  const step = niceStep(Math.max(hi0 - lo0, hi0 * 0.1, 1));
  const lo = Math.max(0, Math.floor(lo0 / step) * step - (lo0 === hi0 ? step : 0));
  const hi = Math.ceil(hi0 / step) * step + (lo0 === hi0 ? step : 0);
  const ticks: number[] = [];
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 100) / 100);

  const x = (i: number) => L + (i / (points.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${y(lo)} L${x(0).toFixed(1)},${y(lo)} Z`;
  const last = points[points.length - 1];
  const labelIdx = points.length <= 6 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <figure className={s.chart}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Verlauf ${weighted ? "schwerster Satz in kg" : "maximale Wiederholungen"}, ${points.length} Trainingstage`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={s.grid} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className={s.axis}>{t}</text>
          </g>
        ))}
        <path d={area} className={s.area} />
        <path d={line} className={s.line} />
        {points.map((p, i) => <circle key={p.day} cx={x(i)} cy={y(p.v)} r={i === points.length - 1 ? 5 : 3} className={i === points.length - 1 ? s.dotLast : s.dot} />)}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className={s.axis}>
            {formatDate(points[i].day).slice(0, 6)}
          </text>
        ))}
      </svg>
      <figcaption className="small">
        {weighted ? "Schwerster Satz pro Trainingstag (kg)" : "Maximale Wiederholungen pro Trainingstag"} · zuletzt {last.v}{weighted ? " kg" : ""}
      </figcaption>
    </figure>
  );
}
