import { motion } from "motion/react";
import { SectionHeading } from "./SectionHeading";
import veggie from "@/assets/veggie.png.asset.json";
import fruits from "@/assets/fruuits.png.asset.json";
import dairy from "@/assets/dairy.png.asset.json";
import noodles from "@/assets/noodles.png.asset.json";
import snacks from "@/assets/snaks.png.asset.json";
import beverages from "@/assets/beverGES.png.asset.json";
import stationery from "@/assets/staionary.png.asset.json";
import personal from "@/assets/personal.png.asset.json";

const categories = [
  { img: veggie.url, name: "Vegetables" },
  { img: fruits.url, name: "Fruits" },
  { img: dairy.url, name: "Dairy" },
  { img: noodles.url, name: "Instant food" },
  { img: snacks.url, name: "Snacks" },
  { img: beverages.url, name: "Beverages" },
  { img: stationery.url, name: "Stationery" },
  { img: personal.url, name: "Personal care" },
];

export function Categories() {
  return (
    <section id="categories" aria-labelledby="cat-heading" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Shop"
          title={<>Everything you'd actually run out of.</>}
          description="From a single apple to a full week's stock — organised the way students shop."
        />

        <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((c, i) => (
            <motion.a
              key={c.name}
              href="#"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-4 transition-all hover:border-foreground/20 hover:-translate-y-0.5"
            >
              <div className="grid place-items-center h-12 w-12 shrink-0 rounded-xl bg-primary-soft overflow-hidden">
                <img src={c.img} alt="" className="h-9 w-9 object-contain" loading="lazy" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">Explore →</div>
              </div>
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
}
