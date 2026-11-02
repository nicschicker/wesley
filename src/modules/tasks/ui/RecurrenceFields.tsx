"use client";

import { useState } from "react";
import type { Recurrence } from "../model";
import { WEEKDAYS_SHORT } from "@/core/date";
import s from "./tasks.module.css";

/** Auswahl einmalig / täglich / an Wochentagen / monatlich. */
export function RecurrenceFields({ idPrefix, initial }: { idPrefix: string; initial?: Recurrence | null }) {
  const [freq, setFreq] = useState<string>(initial?.freq ?? "none");
  const weekdays = initial?.freq === "weekly" ? initial.weekdays : [1, 2, 3, 4, 5];
  const day = initial?.freq === "monthly" ? initial.day : 1;

  return (
    <div className={s.recurrence}>
      <div className="field">
        <label htmlFor={`${idPrefix}-freq`}>Wiederholung</label>
        <select id={`${idPrefix}-freq`} name="freq" className="input" value={freq} onChange={(e) => setFreq(e.target.value)}>
          <option value="none">Einmalig</option>
          <option value="daily">Täglich (Routine)</option>
          <option value="weekly">An Wochentagen</option>
          <option value="monthly">Monatlich</option>
        </select>
      </div>
      {freq === "weekly" && (
        <fieldset className={s.weekdays}>
          <legend className="small">Tage</legend>
          {WEEKDAYS_SHORT.map((w, i) => (
            <label key={w} className={s.weekday}>
              <input type="checkbox" name="weekdays" value={i + 1} defaultChecked={weekdays.includes(i + 1)} />
              <span>{w}</span>
            </label>
          ))}
        </fieldset>
      )}
      {freq === "monthly" && (
        <div className="field">
          <label htmlFor={`${idPrefix}-day`}>Am Tag</label>
          <input id={`${idPrefix}-day`} name="month_day" type="number" min={1} max={31} defaultValue={day} className="input" />
        </div>
      )}
    </div>
  );
}
