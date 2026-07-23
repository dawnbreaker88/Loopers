import logo from "@/assets/loopers-logo.png";

export function Logo({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <img
      src={logo}
      alt="Loopers"
      style={{ height: size }}
      className={`w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
