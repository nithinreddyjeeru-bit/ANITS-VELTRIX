"use client";

import { motion } from "framer-motion";

export default function VeltrixLogo() {
  return (
    <div className="group cursor-pointer" style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <motion.span 
          className="font-bangers"
          style={{ 
            fontSize: "2.2rem", 
            color: "white", 
            letterSpacing: "1px",
            textShadow: "3px 3px 0 var(--pink)"
          }}
          whileHover={{ x: -2, y: -2, textShadow: "5px 5px 0 var(--green)" }}
        >
          ANITS
        </motion.span>
        
        <motion.span 
          className="font-bebas"
          style={{ 
            fontSize: "1.0rem", 
            color: "var(--green)", 
            letterSpacing: "2px",
            opacity: 0.8
          }}
          whileHover={{ opacity: 1, letterSpacing: "4px" }}
        >
          VELTRIX
        </motion.span>
      </div>
      
      <div 
        className="font-space"
        style={{ 
          fontSize: "0.65rem", 
          color: "white", 
          letterSpacing: "4px", 
          opacity: 0.5,
          marginTop: "-2px",
          textTransform: "uppercase",
          fontWeight: 600
        }}
      >
        UNIVERSE
      </div>
    </div>
  );
}
