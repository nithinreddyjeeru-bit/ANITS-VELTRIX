"use client";

import React from "react";
import { motion } from "framer-motion";

interface ComicProgressProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export default function ComicProgress({ steps, currentStep }: ComicProgressProps) {
  return (
    <div className="comic-progress-container font-space">
      <div className="steps-wrapper">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          
          return (
            <React.Fragment key={idx}>
              {/* Stepper Node */}
              <div className="step-node-container">
                <motion.div 
                  className={`step-bubble ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                  animate={{ 
                    scale: isActive ? [1, 1.1, 1] : 1,
                    rotate: isActive ? [0, -3, 3, 0] : 0 
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: isActive ? Infinity : 0, 
                    repeatDelay: 5 
                  }}
                >
                  {isCompleted ? "✓" : idx + 1}
                </motion.div>
                <span className={`step-label font-bebas ${isActive ? "active" : ""}`}>
                  {step}
                </span>
              </div>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className={`step-connector ${idx < currentStep ? "filled" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style jsx>{`
        .comic-progress-container {
          width: 100%;
          padding: 20px;
          background: #FFF;
          border: 4px solid #000;
          box-shadow: 8px 8px 0px #000;
          margin-bottom: 30px;
          border-radius: 4px;
        }
        .steps-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .step-node-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
          flex: 1;
        }
        .step-bubble {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: 3px solid #000;
          background: #FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          color: #000;
          box-shadow: 3px 3px 0px #000;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .step-bubble.active {
          background: var(--yellow, #FFE600);
          box-shadow: 4px 4px 0px #000;
          transform: scale(1.1);
        }
        .step-bubble.completed {
          background: var(--green, #39FF14);
          color: #000;
        }
        .step-label {
          margin-top: 8px;
          font-size: 1.1rem;
          letter-spacing: 0.5px;
          text-align: center;
          color: #000;
          opacity: 0.6;
          transition: all 0.3s ease;
        }
        .step-label.active {
          opacity: 1;
          font-weight: bold;
          text-shadow: 1px 1px 0px var(--yellow, #FFE600);
        }
        .step-connector {
          flex: 1;
          height: 6px;
          background: #E0E0E0;
          border: 2px solid #000;
          margin: 0 -10px;
          margin-top: -24px;
          z-index: 1;
          transition: background 0.4s ease;
        }
        .step-connector.filled {
          background: var(--pink, #FF007F);
        }

        @media (max-width: 768px) {
          .step-label {
            font-size: 0.85rem;
            display: none; /* Hide labels on very small mobile for clean responsive experience, or show active only */
          }
          .step-node-container .step-label.active {
            display: block;
            position: absolute;
            bottom: -15px;
          }
          .step-bubble {
            width: 36px;
            height: 36px;
            font-size: 1rem;
          }
          .step-connector {
            margin-top: 0px;
            transform: translateY(-18px);
          }
          .comic-progress-container {
            padding: 12px;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}
