// import React from "react";

// export default function Logo({
//   className = "",
//   textSize = 32,
// }) {
//   return (
//     <div className={`inline-flex items-center select-none ${className}`}>
//       <span
//         className="font-black tracking-tight leading-none flex items-center"
//         style={{ fontSize: `${textSize}px` }}
//       >
//         <span className="text-black dark:text-white">L</span>
//         <span className="text-[#40A2E3]">oo</span>
//         <span className="text-black dark:text-white">pers</span>
//         <span className="text-red-500 ml-0.5">.</span>
//       </span>
//     </div>
//   );
// }


import React from "react";

const sizeMap = {
  sm: "h-8",    // 32px
  md: "h-10",   // 40px
  lg: "h-12",   // 48px
  xl: "h-16",   // 64px
};

export default function Logo({
  className = "",
  size = "xl",      // sm | md | lg | xl
  height,           // Optional custom height in px
}) {
  return (
    <img
      src="/lopo.png"
      alt="Loopers"
      draggable={false}
      loading="eager"
      className={`
        object-contain
        select-none
        w-auto
        ${height ? "" : sizeMap[size]}
        ${className}
      `}
      style={height ? { height: `${height}px` } : undefined}
    />
  );
}