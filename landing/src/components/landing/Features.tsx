import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const bramiDabbulu = "/assets/brami-dabbulu.png";
const shopFreely = "/assets/shop-freely-v2.png";

const springConfig = { stiffness: 70, damping: 22, restDelta: 0.001 };

export function Features() {
  const heroCardRef = useRef<HTMLDivElement>(null);
  const shopFreelyRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroCardRef,
    offset: ["start end", "center center"],
  });

  // Photo leads, ₹1 card follows with a stagger
  const photoX = useTransform(heroProgress, [0, 0.75], ["100%", "0%"]);
  const photoOpacity = useTransform(heroProgress, [0, 0.45], [0, 1]);
  const photoScale = useTransform(heroProgress, [0, 0.75], [0.85, 1]);

  const feeCardX = useTransform(heroProgress, [0.12, 0.88], ["-80%", "0%"]);
  const feeCardOpacity = useTransform(heroProgress, [0.12, 0.55], [0, 1]);

  const smoothPhotoX = useSpring(photoX, springConfig);
  const smoothPhotoOpacity = useSpring(photoOpacity, springConfig);
  const smoothPhotoScale = useSpring(photoScale, springConfig);
  const smoothFeeCardX = useSpring(feeCardX, springConfig);
  const smoothFeeCardOpacity = useSpring(feeCardOpacity, springConfig);

  const { scrollYProgress: shopFreelyProgress } = useScroll({
    target: shopFreelyRef,
    offset: ["start end", "center center"],
  });

  const shopFreelyX = useTransform(shopFreelyProgress, [0, 0.8], ["-80%", "0%"]);
  const shopFreelyOpacity = useTransform(shopFreelyProgress, [0, 0.5], [0, 1]);

  const smoothShopFreelyX = useSpring(shopFreelyX, springConfig);
  const smoothShopFreelyOpacity = useSpring(shopFreelyOpacity, springConfig);

  return (
    <section id="features" aria-labelledby="features-heading" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Why Loopers"
          title={
            <>
              Fair pricing. <span className="text-muted-foreground">Real convenience.</span>
            </>
          }
        />

        {/* Shop Freely — light blue ribbon card with delivery illustration */}
        <div ref={shopFreelyRef} className="mt-10 sm:mt-14">
          <motion.div
            style={{ x: smoothShopFreelyX, opacity: smoothShopFreelyOpacity }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-4xl">
              <div
                className="relative bg-shop-freely-bg text-shop-freely-text p-6 sm:p-8 lg:p-10 shadow-[0_20px_45px_-15px_oklch(0.66_0.16_232/0.35)]"
                style={{
                  clipPath:
                    "polygon(0% 10%, 3% 18%, 0% 26%, 3% 34%, 0% 42%, 3% 50%, 0% 58%, 3% 66%, 0% 74%, 3% 82%, 0% 90%, 100% 90%, 97% 82%, 100% 74%, 97% 66%, 100% 58%, 97% 50%, 100% 42%, 97% 34%, 100% 26%, 97% 18%, 100% 10%)",
                }}
              >
                <div className="flex flex-col items-center justify-center text-center gap-3 sm:gap-4 p-4 sm:p-6 lg:p-8">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-shop-freely-text/80 font-bold"></p>
                  <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-none text-shop-freely-text">
                    Need Just One Item?
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-shop-freely-text/80 font-medium max-w-xs sm:max-w-sm">
                    We won't make you buy five more.
                  </p>
                  <a
                    href="/app"
                    className="group inline-flex items-center gap-2 rounded-full bg-shop-freely-text px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-bold text-white shadow-soft transition-all hover:scale-[1.04] active:scale-[0.98]"
                  >
                    Shop Freely
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ₹1 Delivery Fee — photo + card with staggered scroll reveal */}
        <div ref={heroCardRef} className="mt-4 sm:mt-6">
          <motion.div
            style={{ x: smoothPhotoX, opacity: smoothPhotoOpacity, scale: smoothPhotoScale }}
            className="w-full overflow-hidden"
          >
            <motion.img
              src={bramiDabbulu}
              alt="Dabbulu Evariki Urike Raavu — money doesn't come for free"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-full max-w-[18rem] sm:max-w-[22rem] lg:max-w-[26rem] h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)]"
              loading="lazy"
            />
          </motion.div>

          <motion.div
            style={{ x: smoothFeeCardX, opacity: smoothFeeCardOpacity }}
            className="relative mt-6 sm:mt-8 flex items-center justify-center"
          >
            {/* Red ribbon / coupon card */}
            <div className="relative w-full max-w-4xl">
              <div
                className="relative bg-[#ff2c2c] text-white p-8 sm:p-10 lg:p-12 shadow-[0_20px_45px_-15px_rgba(255,44,44,0.55)]"
                style={{
                  clipPath:
                    "polygon(0% 10%, 3% 18%, 0% 26%, 3% 34%, 0% 42%, 3% 50%, 0% 58%, 3% 66%, 0% 74%, 3% 82%, 0% 90%, 100% 90%, 97% 82%, 100% 74%, 97% 66%, 100% 58%, 97% 50%, 100% 42%, 97% 34%, 100% 26%, 97% 18%, 100% 10%)",
                }}
              >
                <div className="flex flex-col items-center justify-center text-center gap-4 sm:gap-5">
                  <p className="text-sm sm:text-base lg:text-lg uppercase tracking-[0.18em] text-white/90 font-bold">
                    Flat delivery charge
                  </p>
                  <h3 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-none">
                    ₹1 Delivery Fee
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-white/90 font-medium max-w-xs sm:max-w-sm">
                    On every single order
                  </p>
                  <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm sm:text-base font-bold text-[#ff2c2c]">
                    No Minimum Order
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
