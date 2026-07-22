import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";

export function OfferBanner() {
  return (
    <section id="start" aria-labelledby="offer-heading" className="relative py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] p-10 sm:p-14 lg:p-16 shadow-lift"
          style={{
            backgroundImage:
              "linear-gradient(135deg, oklch(0.68 0.14 232) 0%, oklch(0.62 0.16 200) 55%, oklch(0.68 0.14 145) 100%)",
          }}
        >
          <div
            aria-hidden
            className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:24px_24px] opacity-30"
          />

          <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-8">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                Visit Loopers
              </div>
              <h2
                id="offer-heading"
                className="mt-4 font-display text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] leading-[1.05]"
              >
                Ready to order?
              </h2>
              <p className="mt-4 text-white/90 text-lg max-w-lg">
                Everything students need. Delivered in minutes. No minimum order. Only ₹1 delivery
                fee.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-self-end">
              <a
                href="/app"
                className="group inline-flex items-center gap-2 rounded-full bg-white text-primary px-7 py-4 text-base font-bold shadow-glow transition-all hover:scale-[1.04] active:scale-[0.98]"
              >
                Visit Loopers
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="/app"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur text-white px-7 py-4 text-base font-semibold transition-all hover:bg-white/20 hover:scale-[1.03] active:scale-[0.98]"
              >
                Browse Products
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
