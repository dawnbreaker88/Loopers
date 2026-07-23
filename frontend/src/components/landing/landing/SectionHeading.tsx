import { motion } from "motion/react";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 font-display text-[2rem] sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-[0.95rem] sm:text-base text-muted-foreground leading-relaxed max-w-lg">
          {description}
        </p>
      )}
    </motion.div>
  );
}
