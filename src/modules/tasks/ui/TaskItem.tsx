import { Check, Repeat, Trash2 } from "lucide-react";
import { deleteTask, setTaskStatus, toggleTask } from "../actions";
import { describeRecurrence, isOverdue, PRIORITY_LABEL, type Task } from "../model";
import { relativeDay } from "@/core/date";
import { AutoSubmitSelect } from "./AutoSubmitSelect";
import { TaskEditForm } from "./TaskEditForm";
import s from "./tasks.module.css";

type Props = {
  task: Task;
  today: string;
  doneToday?: boolean; // für Routinen
  withModule?: boolean;
  modules?: string[];
  areaName?: string; // auf «Heute» anzeigen, aus welchem Bereich
};

function PriorityBars({ priority }: { priority: Task["priority"] }) {
  const n = priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  return (
    <span className={s.bars} title={`Priorität: ${PRIORITY_LABEL[priority]}`} aria-label={`Priorität ${PRIORITY_LABEL[priority]}`}>
      {[1, 2, 3].map((i) => <span key={i} className={i <= n ? s.barOn : s.barOff} style={{ height: 4 + i * 3 }} />)}
    </span>
  );
}

export function TaskItem({ task, today, doneToday, withModule = false, modules = [], areaName }: Props) {
  const recurring = task.kind === "recurring";
  const checked = recurring ? !!doneToday : task.status === "done";
  const overdue = isOverdue(task, today);

  return (
    <li className={`${s.item} ${checked ? s.itemDone : ""}`}>
      <form action={toggleTask}>
        <input type="hidden" name="id" value={task.id} />
        <button type="submit" className={`${s.check} ${checked ? s.checkOn : ""}`} aria-label={checked ? `«${task.title}» wieder öffnen` : `«${task.title}» abhaken`}>
          {checked && <Check size={16} strokeWidth={3} aria-hidden />}
        </button>
      </form>

      <div className={s.body}>
        <details className={s.details}>
          <summary className={s.summary}>
            <span className={s.title}>{task.title}</span>
            <span className={s.meta}>
              {areaName && <span className={s.chip}>{areaName}</span>}
              {task.module && <span className={s.chip}>{task.module}</span>}
              {recurring && (
                <span className={s.metaText}><Repeat size={13} strokeWidth={2} aria-hidden /> {describeRecurrence(task.recurrence)}</span>
              )}
              {task.due_date && !recurring && (
                <span className={overdue ? s.overdue : s.metaText}>{overdue ? "überfällig · " : "fällig "}{relativeDay(task.due_date, today)}</span>
              )}
              {task.notes && <span className={s.metaText}>Notiz</span>}
            </span>
          </summary>
          <div className={s.editPanel}>
            {task.notes && <p className={s.notes}>{task.notes}</p>}
            <TaskEditForm task={task} withModule={withModule} modules={modules} />
            <form action={deleteTask}>
              <input type="hidden" name="id" value={task.id} />
              <button type="submit" className="btn btn-quiet"><Trash2 size={16} strokeWidth={1.75} aria-hidden /> Task löschen</button>
            </form>
          </div>
        </details>
      </div>

      <div className={s.side}>
        <PriorityBars priority={task.priority} />
        {!recurring && (
          <form action={setTaskStatus}>
            <input type="hidden" name="id" value={task.id} />
            <label className="sr-only" htmlFor={`st-${task.id}`}>Status</label>
            <AutoSubmitSelect id={`st-${task.id}`} name="status" defaultValue={task.status} className={`${s.status} ${s[`st_${task.status}`]}`}>
              <option value="open">Offen</option>
              <option value="in_progress">In Arbeit</option>
              <option value="waiting">Wartet</option>
              <option value="done">Erledigt</option>
            </AutoSubmitSelect>
          </form>
        )}
      </div>
    </li>
  );
}
