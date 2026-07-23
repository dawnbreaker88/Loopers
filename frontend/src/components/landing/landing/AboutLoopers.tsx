import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import bramiAsset from "@/assets/brami-hi.png.asset.json";

export function AboutLoopers() {
  const bramiRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: bramiRef,
    offset: ["start end", "center center"],
  });

  const photoX = useTransform(scrollYProgress, [0, 1], ["-100%", "0%"]);
  const photoOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);

  return (
    <section id="about" aria-labelledby="about-heading" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* Brami photo — above About Loopers, reveals from left on scroll */}
        <motion.div
          ref={bramiRef}
          style={{ x: photoX, opacity: photoOpacity, scale: photoScale }}
          className="w-full overflow-hidden"
        >
          <motion.img
            src={bramiAsset.url}
            alt="Friendly wave saying hi"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-[20rem] sm:max-w-[24rem] lg:max-w-[28rem] h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)]"
            loading="lazy"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-10 sm:mt-14 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
        >
          About Loopers
        </motion.p>
        <motion.h2
          id="about-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mt-3 font-display text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-foreground leading-[1.05]"
        >
          Quick commerce, rebuilt around{" "}
          <span className="text-primary">student life.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl"
        >
          Most delivery apps chase big family carts. Loopers doesn't.
          We started because ordering a single carton of milk shouldn't cost
          three delivery fees or hit a ₹199 minimum. Whether you're in a
          hostel, PG, apartment or on campus — one item is enough.
        </motion.p>
      </div>
    </section>
  );
}
