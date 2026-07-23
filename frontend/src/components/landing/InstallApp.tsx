import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import { 
  Chrome, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle, 
  MoreVertical, 
  Download,
  Apple
} from "lucide-react";

type OSType = "android" | "ios";

export function InstallApp() {
  const [activeOS, setActiveOS] = useState<OSType>("android");

  const androidSteps = [
    {
      step: "01",
      title: "Open Browser Menu",
      description: "Tap the three vertical dots (⋮) in the top-right corner of Google Chrome.",
      icon: MoreVertical,
    },
    {
      step: "02",
      title: "Tap Install App",
      description: "Select 'Install App' or 'Add to Home screen' from the dropdown list.",
      icon: Download,
    },
    {
      step: "03",
      title: "Launch & Enjoy",
      description: "Open Loopers from your home screen for full-screen mode and faster performance.",
      icon: CheckCircle,
    },
  ];

  const iosSteps = [
    {
      step: "01",
      title: "Tap Share Button",
      description: "Tap the Share icon (box with an upward arrow) at the bottom of Safari.",
      icon: Share,
    },
    {
      step: "02",
      title: "Add to Home Screen",
      description: "Scroll down the sharing menu and select 'Add to Home Screen'.",
      icon: PlusSquare,
    },
    {
      step: "03",
      title: "Launch & Enjoy",
      description: "Open Loopers from your home screen for an immersive, full-screen PWA experience.",
      icon: CheckCircle,
    },
  ];

  const activeSteps = activeOS === "android" ? androidSteps : iosSteps;

  return (
    <section id="install" className="relative py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionHeading
            eyebrow="Better Experience"
            title={<>Install Loopers on your phone</>}
            description="Add Loopers to your home screen to enjoy instant loading, real-time order tracking, and push notifications with zero extra storage used."
          />

          {/* OS Switcher Buttons */}
          <div className="inline-flex rounded-2xl bg-muted p-1 border border-border self-start md:self-auto shrink-0 shadow-sm">
            <button
              onClick={() => setActiveOS("android")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeOS === "android"
                  ? "bg-surface-elevated text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Chrome className="h-4 w-4 text-emerald-500" />
              Android / Chrome
            </button>
            <button
              onClick={() => setActiveOS("ios")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeOS === "ios"
                  ? "bg-surface-elevated text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Apple className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              iPhone / Safari
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="mt-12 sm:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <AnimatePresence mode="wait">
              {activeSteps.map((stepData, idx) => {
                const IconComponent = stepData.icon;
                return (
                  <motion.div
                    key={`${activeOS}-${stepData.step}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.4, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface-elevated p-8 shadow-xs hover:border-primary/50 transition-colors group"
                  >
                    <div>
                      {/* Step Number & Icon */}
                      <div className="flex items-center justify-between">
                        <span className="font-display text-4xl font-extrabold text-primary/15 group-hover:text-primary/30 transition-colors">
                          {stepData.step}
                        </span>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                          <IconComponent className="h-5 w-5" />
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="mt-6 text-xl font-bold text-foreground tracking-tight">
                        {stepData.title}
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {stepData.description}
                      </p>
                    </div>

                    {/* Connecting Line indicators for larger screens */}
                    {idx < 2 && (
                      <div aria-hidden className="hidden md:block absolute top-1/2 -right-3 translate-y-[-50%] z-10 text-border">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 rounded-3xl bg-muted/30 border border-border/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Why install?</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                PWAs use less than 1MB of space, load instantly, and support push notifications.
              </p>
            </div>
          </div>
          <a
            href="/app"
            className="w-full sm:w-auto text-center rounded-2xl bg-primary text-white text-sm font-bold px-6 py-3 shadow-md hover:scale-[1.02] active:scale-95 transition-all"
          >
            Launch Loopers Web App
          </a>
        </motion.div>

      </div>
    </section>
  );
}
