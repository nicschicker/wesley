"use client";

/** Select, das beim Ändern sein Formular sofort absendet (z. B. Status in der Liste). */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
