import { motion } from "motion/react";
import { GraduationCap, Ban, Coins, CalendarDays, Zap, MapPin } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const benefits = [
  {
    icon: GraduationCap,
    title: "Student-Friendly Experience",
    tint: "bg-primary-soft text-primary",
  },
  { icon: Ban, title: "No Minimum Order", tint: "bg-secondary/15 text-secondary" },
  { icon: Coins, title: "₹1 Delivery Fee", tint: "bg-yellow-500/15 text-yellow-600" },
  { icon: CalendarDays, title: "Open Every Day", tint: "bg-indigo-500/10 text-indigo-500" },
  { icon: Zap, title: "Quick Delivery", tint: "bg-pink-500/10 text-pink-500" },
  { icon: MapPin, title: "Campus & Hostel Friendly", tint: "bg-emerald-500/10 text-emerald-600" },
];

export function StudentBenefits() {
  return (
    <section aria-labelledby="benefits-heading" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Student Benefits"
          title={
            <>
              Built around <em className="text-secondary not-italic">student life.</em>
            </>
          }
        />

        <div className="mt-14 grid grid-cols-2 md:grid-cols-3 gap-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
              className="group flex items-center gap-4 rounded-3xl border border-border bg-surface-elevated p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift hover:border-primary/30"
            >
              <div
                className={`grid place-items-center h-12 w-12 shrink-0 rounded-2xl ${b.tint} transition-transform group-hover:scale-110`}
              >
                <b.icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <span className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                {b.title}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
