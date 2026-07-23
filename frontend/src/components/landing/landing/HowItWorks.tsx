import { motion } from "motion/react";
import { useRef, useState } from "react";
import LottieImport, { type LottieRefCurrentProps } from "lottie-react";
const Lottie = ((LottieImport as unknown as { default?: typeof LottieImport }).default ?? LottieImport) as typeof LottieImport;
import { SectionHeading } from "./SectionHeading";
import searchAnim from "@/assets/search-lottie.json";
import paymentAnim from "@/assets/payment-lottie.json";
import trackingAnim from "@/assets/tracking-lottie.json";
import packagingAnim from "@/assets/packaging-lottie.json";

const steps = [
  { n: "01", title: "Browse", desc: "Open Loopers, pick what you need. Even one item is fine.", animation: searchAnim },
  { n: "02", title: "Checkout", desc: "Add address, pay with UPI, card or cash on delivery.", animation: paymentAnim },
  { n: "03", title: "Track", desc: "Watch your rider move in real time on the map.", animation: trackingAnim },
  { n: "04", title: "Unbox", desc: "Delivered straight to your gate, hostel, or floor.", animation: packagingAnim },
];

function StepCard({ s, i }: { s: (typeof steps)[number]; i: number }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [hovered, setHovered] = useState(false);

  const handleEnter = () => {
    if (!s.animation) return;
    setHovered(true);
    lottieRef.current?.goToAndPlay(0, true);
  };
  const handleLeave = () => {
    setHovered(false);
    lottieRef.current?.stop();
  };

  return (
    <motion.li
      initial={{ opacity: 0, x: -140, scale: 0.7 }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: i * 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="relative overflow-hidden rounded-2xl border border-border bg-surface-elevated p-6 transition-colors"
    >
      <div
        className={`transition-opacity duration-300 ${hovered && s.animation ? "opacity-0" : "opacity-100"}`}
      >
        <div className="font-display text-3xl font-semibold text-primary/70">{s.n}</div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
      </div>

      {s.animation && (
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
        >
          <Lottie
            lottieRef={lottieRef}
            animationData={s.animation}
            autoplay={false}
            loop
            className="h-40 w-40"
          />
        </div>
      )}
    </motion.li>
  );
}

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-heading" className="relative py-16 sm:py-24 bg-muted/50">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="How it works"
          title={<>From craving to doorstep in four steps.</>}
        />

        <ol className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s, i) => (
            <StepCard key={s.n} s={s} i={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
