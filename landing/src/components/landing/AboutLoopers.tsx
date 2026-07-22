import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useRef } from "react";
import { Sparkles } from "lucide-react";

const bramiAsset = "/assets/brami-hi.png";

const springConfig = { stiffness: 70, damping: 22, restDelta: 0.001 };

export function AboutLoopers() {
  const bramiRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: bramiRef,
    offset: ["start end", "center center"],
  });

  const photoX = useTransform(scrollYProgress, [0, 1], ["-40%", "0%"]);
  const photoOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);

  const smoothPhotoX = useSpring(photoX, springConfig);
  const smoothPhotoOpacity = useSpring(photoOpacity, springConfig);
  const smoothPhotoScale = useSpring(photoScale, springConfig);

  return (
    <section
      id="about"
      ref={containerRef}
      aria-labelledby="about-heading"
      className="relative py-20 sm:py-28 overflow-hidden bg-background text-foreground"
    >
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary-soft/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-secondary-soft/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Story Section */}
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-center">
          {/* Brami illustration */}
          <div className="flex justify-center lg:justify-start">
            <motion.div
              ref={bramiRef}
              style={{ x: smoothPhotoX, opacity: smoothPhotoOpacity, scale: smoothPhotoScale }}
              className="w-full max-w-[18rem] sm:max-w-[22rem] lg:max-w-[26rem] overflow-hidden"
            >
              <motion.img
                src={bramiAsset}
                alt="Loopers welcome greeting"
                className="w-full h-auto object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.06)]"
                loading="lazy"
              />
            </motion.div>
          </div>

          {/* About Copy */}
          <div className="flex flex-col justify-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-xs font-bold uppercase tracking-[0.18em] text-primary"
            >
              About Loopers
            </motion.span>

            <motion.h2
              id="about-heading"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]"
            >
              Making daily essentials simple and reliable.
            </motion.h2>

            <div className="mt-8 space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="font-medium text-foreground"
              >
                Loopers began with a simple observation: People often spend more time travelling for
                everyday essentials than actually buying them.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                Whether it's groceries, snacks, stationery, or important printouts, these small
                everyday tasks shouldn't interrupt your day. We created Loopers to make access to
                daily essentials faster, simpler, and more reliable through a thoughtfully designed
                hyperlocal delivery platform.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Our vision is to build technology that quietly solves everyday problems while
                providing a delightful experience for everyone who uses it.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                As Loopers grows, our commitment remains the same: build something useful,
                dependable, and genuinely loved by the community.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Highlighted Mission Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mt-20 sm:mt-28 relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary-soft/50 via-background to-secondary-soft/30 p-8 sm:p-12 text-center shadow-soft"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 dark:opacity-10 pointer-events-none">
            <Sparkles className="h-24 w-24 text-primary" />
          </div>
          <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary dark:bg-primary/20 dark:text-primary-foreground">
              Our Mission
            </span>
            <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-snug">
              “Our mission is to build the simplest and most reliable hyperlocal delivery platform
              that people genuinely enjoy using.”
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
