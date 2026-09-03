"use client";

import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  delay?: string;
};

export default function Panel({
  title,
  description,
  children,
  delay = "0s",
}: PanelProps) {
  return (
    <section className="panel animate-rise" style={{ animationDelay: delay }}>
      <div className="panel-header">
        <h3 className="panel-title font-display">{title}</h3>
        {description ? <p className="panel-desc">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
