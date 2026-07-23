import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import videoAsset from "@/assets/shop-transition.mp4.asset.json";

export const SHOP_TRANSITION_EVENT = "shop-transition:play";

export function triggerShopTransition() {
  window.dispatchEvent(new Event(SHOP_TRANSITION_EVENT));
}

export function ShopTransition() {
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const preloadRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();

  // Preload the video into the browser's media cache before the overlay opens
  useEffect(() => {
    const v = preloadRef.current;
    if (v) {
      v.src = videoAsset.url;
      v.load();
    }
  }, []);

  useEffect(() => {
    const handler = () => setActive(true);
    window.addEventListener(SHOP_TRANSITION_EVENT, handler);
    return () => window.removeEventListener(SHOP_TRANSITION_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  const handleEnded = () => {
    navigate({ to: "/" });
    // small delay so navigation commits before we unmount overlay
    requestAnimationFrame(() => setActive(false));
  };

  return (
    <>
      {/* Hidden preloader stays in the DOM so the video is buffered before the overlay opens */}
      <video
        ref={preloadRef}
        preload="auto"
        muted
        playsInline
        aria-hidden
        className="hidden"
      />
      <AnimatePresence>
        {active && (
          <motion.div
            key="shop-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#f9fbf8] pointer-events-auto"
            style={{ touchAction: "none" }}
            aria-hidden
          >
            {/* Mobile: full-screen stage matching the video's background. Desktop: smaller phone-ratio box. */}
            <div className="relative z-10 flex h-full w-full items-center justify-center sm:w-[80vw] sm:max-w-[360px] lg:max-w-[420px] sm:h-[75vh] sm:max-h-[75vh] sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl sm:ring-1 sm:ring-white/10">
              <video
                ref={videoRef}
                src={videoAsset.url}
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={handleEnded}
                className="h-full w-full object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
