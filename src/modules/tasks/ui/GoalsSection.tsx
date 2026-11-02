import { Target, Trash2 } from "lucide-react";
import { deleteGoal } from "../actions";
import type { Goal } from "../queries";
import { formatDate } from "@/core/date";
import { GoalForm } from "./GoalForm";
import s from "./tasks.module.css";

const STATUS: Record<Goal["status"], string> = { active: "Aktiv", achieved: "Erreicht", dropped: "Verworfen" };

export function GoalsSection({ areaId, goals }: { areaId: string; goals: Goal[] }) {
  return (
    <section className={s.section} aria-labelledby="h-goals">
      <div className={s.sectionHead}>
        <h2 id="h-goals">Langfristige Ziele</h2>
        <span className="small">{goals.filter((g) => g.status === "active").length} aktiv</span>
      </div>

      {goals.length === 0 ? (
        <p className="small">Noch keine Ziele. Halte fest, worauf du über Wochen und Monate hinarbeitest.</p>
      ) : (
        <ul className={s.goals}>
          {goals.map((g) => (
            <li key={g.id} className={`${s.goal} ${g.status !== "active" ? s.goalInactive : ""}`}>
              <details>
                <summary className={s.goalSummary}>
                  <Target size={18} strokeWidth={1.75} aria-hidden className={s.goalIcon} />
                  <span className={s.goalMain}>
                    <span className={s.title}>{g.title}</span>
                    <span className={s.meta}>
                      <span className={s.metaText}>{STATUS[g.status]}</span>
                      {g.target_date && <span className={s.metaText}>bis {formatDate(g.target_date)}</span>}
                    </span>
                  </span>
                  <span className={s.goalProgress} aria-label={`Fortschritt ${g.progress} Prozent`}>
                    <span className={s.goalPct}>{g.progress}%</span>
                    <span className={s.goalBar}><span style={{ width: `${g.progress}%` }} /></span>
                  </span>
                </summary>
                <div className={s.editPanel}>
                  {g.notes && <p className={s.notes}>{g.notes}</p>}
                  <GoalForm areaId={areaId} goal={g} />
                  <form action={deleteGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <button type="submit" className="btn btn-quiet"><Trash2 size={16} strokeWidth={1.75} aria-hidden /> Ziel löschen</button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <details className={s.addGoal}>
        <summary className="btn btn-secondary">Neues Ziel</summary>
        <div className={s.editPanel}><GoalForm areaId={areaId} /></div>
      </details>
    </section>
  );
}
