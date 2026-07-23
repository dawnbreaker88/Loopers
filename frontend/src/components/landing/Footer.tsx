
import { Linkedin } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative border-t border-border bg-gradient-to-b from-transparent to-primary-soft/40 pt-16 pb-8"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 items-start">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The student-first quick commerce platform delivering groceries, snacks, stationery,
              and daily essentials when you need them.
            </p>
          </div>

        </div>

        {/* Subtle developer credit line */}
        <div className="mt-12 pt-6 border-t border-border/60 text-center sm:text-left">
          <p className="text-xs text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-2">
            <span>Built by:</span>
            <a
              href="https://www.linkedin.com/in/sree-nilay-reddy/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground hover:text-primary font-bold transition-colors"
            >
              <Linkedin className="h-3 w-3 text-[#0077b5]" />
              Sreenilay Reddy
            </a>
            <span className="text-border/80">•</span>

            <a
              href="https://www.linkedin.com/in/vankaprabhath/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground hover:text-primary font-bold transition-colors"
            >
              <Linkedin className="h-3 w-3 text-[#0077b5]" />
              Prabhath
            </a>
            <span className="text-border/80">•</span>
            <a
              href="https://www.linkedin.com/in/hasrith-rao-samudrala-a039651b2/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground hover:text-primary font-bold transition-colors"
            >
              <Linkedin className="h-3 w-3 text-[#0077b5]" />
              Hasrith Rao
            </a>
            <span className="text-border/80">•</span>
            <a
              href="https://www.linkedin.com/in/vivekanandanagireddy/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground hover:text-primary font-bold transition-colors"
            >
              <Linkedin className="h-3 w-3 text-[#0077b5]" />
              Vivekananda
            </a>
          </p>
        </div>

        {/* Copyright and branding */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[11px] text-muted-foreground">© 2026 Loopers. All rights reserved.</p>
          <p className="text-[11px] text-muted-foreground">Made with ❤️ by the Loopers Team.</p>
        </div>
      </div>
    </footer>
  );
}
