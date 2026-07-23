import { motion } from "motion/react";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import { triggerShopTransition } from "./ShopTransition";
import bagAvif480 from "@/assets/loopers-bag-v2-480.avif";
import bagAvif800 from "@/assets/loopers-bag-v2-800.avif";
import bagAvif1200 from "@/assets/loopers-bag-v2-1200.avif";
import bagAvif1600 from "@/assets/loopers-bag-v2-1600.avif";
import bagWebp480 from "@/assets/loopers-bag-v2-480.webp";
import bagWebp800 from "@/assets/loopers-bag-v2-800.webp";
import bagWebp1200 from "@/assets/loopers-bag-v2-1200.webp";
import bagWebp1600 from "@/assets/loopers-bag-v2-1600.webp";

const avifSrcSet = `${bagAvif480} 480w, ${bagAvif800} 800w, ${bagAvif1200} 1200w, ${bagAvif1600} 1600w`;
const webpSrcSet = `${bagWebp480} 480w, ${bagWebp800} 800w, ${bagWebp1200} 1200w, ${bagWebp1600} 1600w`;
const sizesAttr = "(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 90vw";

export function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-24 pb-14 sm:pt-32 lg:pt-40 lg:pb-24"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-16 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">

        <div className="mt-8 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-6 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            <h1
              id="hero-heading"
              className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.5rem] font-semibold tracking-[-0.03em] text-foreground"
            >
              Groceries.
              <br />
              Snacks. Stationery.
              <br />
              <span className="text-primary">In minutes.</span>
            </h1>

            <p className="mt-5 max-w-md text-[0.98rem] sm:text-lg text-muted-foreground leading-relaxed">
              Loopers is a student-first quick commerce app. No minimum order,
              a flat <span className="font-semibold text-foreground">₹1 delivery fee</span>,
              and delivery from <span className="font-semibold text-foreground">7 AM – 2 AM</span>.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => triggerShopTransition()}
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Start shopping
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent-soft"
              >
                Browse categories
              </a>
            </div>

            <div className="mt-8 flex items-center gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
                Campuses & hostels
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
                7 AM – 2 AM daily
              </div>
            </div>
          </motion.div>

          {/* Bag illustration */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative aspect-square max-w-[28rem] sm:max-w-xl lg:max-w-2xl mx-auto">
              <div
                aria-hidden
                className="absolute inset-6 rounded-full bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 blur-2xl"
              />
              <motion.picture
                className="relative z-10 block w-full h-full animate-bag-float"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <source type="image/avif" srcSet={avifSrcSet} sizes={sizesAttr} />
                <source type="image/webp" srcSet={webpSrcSet} sizes={sizesAttr} />
                <img
                  src={bagWebp1200}
                  alt="Loopers grocery bag with milk, apple, greens and snacks held in hand"
                  className="w-full h-full object-contain drop-shadow-[0_25px_40px_rgba(140,90,40,0.22)]"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  width={1200}
                  height={1481}
                />
              </motion.picture>
              <div
                aria-hidden
                className="animate-bag-shadow absolute bottom-[4%] left-1/2 -translate-x-1/2 h-4 w-2/3 rounded-[50%] bg-foreground/30 blur-2xl"
              />

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
