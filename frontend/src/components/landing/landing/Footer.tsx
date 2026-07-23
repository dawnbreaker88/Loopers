import { Instagram } from "lucide-react";
import { Logo } from "./Logo";


const socials = [
  { Icon: Instagram, label: "Instagram" },
];

export function Footer() {
  return (
    <footer id="contact" className="relative border-t border-border bg-gradient-to-b from-transparent to-primary-soft/40 pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1.5fr_2fr] gap-12">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              The student-first quick commerce platform delivering groceries, snacks,
              stationery, and everyday essentials from{" "}
              <span className="font-semibold text-foreground">7:00 AM to 2:00 AM</span>.
              Built for students.
            </p>
            <div className="mt-6 flex gap-2">
              {socials.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid place-items-center h-10 w-10 rounded-full bg-surface-elevated border border-border text-foreground/70 hover:text-primary hover:border-primary hover:scale-110 transition-all shadow-soft"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Loopers Technologies</p>
          <p className="text-xs text-muted-foreground">Built with ❤️ for Students.</p>
        </div>
      </div>
    </footer>
  );
}
