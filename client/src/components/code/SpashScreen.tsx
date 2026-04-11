import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({
  onComplete,
  duration = 2200,
}: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("hold"), 600);
    const exitTimer = setTimeout(() => setPhase("exit"), duration);
    const completeTimer = setTimeout(onComplete, duration + 500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  const isExiting = phase === "exit";

  return (
    <div className="splash-container lato-regular">
      {/* Content */}
      <div
        className={`splash-content ${isExiting ? "splash-content-exit" : ""}`}
      >
        {/* Logo */}
        <div className="splash-logo">
          <img src="/logo.png" alt="Prose-logo" />
        </div>

        {/* Brand Name */}
        <div className="splash-brand-wrapper">
          <h1 className="splash-brand">prose</h1>
        </div>
      </div>

      {/* Exit wipe */}
      <div className={`splash-wipe ${isExiting ? "splash-wipe-active" : ""}`} />
    </div>
  );
}
