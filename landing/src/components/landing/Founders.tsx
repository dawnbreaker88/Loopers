import { motion } from "motion/react";
import { Instagram } from "lucide-react";

interface Founder {
  name: string;
  role: string;
  bio: string;
  initials: string;
  instagram: string;
  avatarBg: string;
}

const founders: Founder[] = [
  {
    name: "Sai Krishna Reddy",
    role: "Founder",
    bio: "Focused on creating reliable digital experiences that solve real-world problems and positively impact communities.",
    initials: "SK",
    instagram: "https://www.instagram.com/_krishna._xx?igsh=MWgzbGd3ZnIwd2I1Yg==",
    avatarBg:
      "from-primary-soft to-primary/20 dark:from-primary/25 dark:to-primary-soft/10 text-primary",
  },
  {
    name: "Sri Nikhil",
    role: "Co-Founder",
    bio: "Passionate about building products that simplify everyday life through technology and thoughtful design.",
    initials: "SN",
    instagram: "https://www.instagram.com/_nikhil__mahankali___?igsh=MThhZjR6ODhpa3NkZg==",
    avatarBg:
      "from-accent-soft to-accent/30 dark:from-accent/25 dark:to-accent-soft/10 text-accent-foreground",
  },
];

export function Founders() {
  return (
    <section
      id="founders"
      aria-labelledby="founders-heading"
      className="relative py-20 sm:py-24 bg-background text-foreground"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Leadership
          </span>
          <h3
            id="founders-heading"
            className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
          >
            Meet the Founders
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {founders.map((founder, i) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group flex flex-col items-center text-center rounded-2xl border border-border bg-card p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-soft"
            >
              {/* Profile Placeholder Initials */}
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${founder.avatarBg} flex items-center justify-center font-display text-3xl font-bold border border-border/40 transition-transform duration-300 group-hover:scale-105`}
              >
                {founder.initials}
              </div>

              {/* Name & Title */}
              <h4 className="mt-6 font-display text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
                {founder.name}
              </h4>
              <span className="text-xs font-bold text-primary uppercase tracking-widest mt-1.5">
                {founder.role}
              </span>

              {/* Bio */}
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
                {founder.bio}
              </p>

              {/* Instagram Link */}
              <a
                href={founder.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted hover:text-primary active:scale-98"
              >
                <Instagram className="h-3.5 w-3.5" />
                Connect on Instagram
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
