import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { label: "Shop", href: "#categories" },
  { label: "Why Loopers", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 16));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-background/80 border-b border-border/70"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 md:flex md:justify-between md:py-4">
          <a href="#home" className="flex min-w-0 items-center" aria-label="Loopers home">
            <Logo size={26} />
          </a>

          <nav className="hidden md:flex items-center gap-0.5" aria-label="Primary">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-3.5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground rounded-full transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <a
              href="#login"
              className="px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
            >
              Login
            </a>
            <a
              href="#start"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Order now
            </a>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden shrink-0 grid place-items-center h-10 w-10 rounded-full bg-surface-elevated border border-border"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="md:hidden overflow-hidden bg-background/98 backdrop-blur-xl border-b border-border"
      >
        <div className="px-4 py-3 flex flex-col gap-0.5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-base font-medium rounded-xl hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-2 pt-3 pb-1">
            <a
              href="#login"
              className="flex-1 text-center px-4 py-3 text-sm font-semibold rounded-full border border-border"
            >
              Login
            </a>
            <a
              href="#start"
              onClick={() => setOpen(false)}
              className="flex-1 text-center px-4 py-3 text-sm font-semibold rounded-full bg-foreground text-background"
            >
              Order now
            </a>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
