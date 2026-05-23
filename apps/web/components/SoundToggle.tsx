"use client"

import { useEffect, useState } from "react";
import { soundCtl } from "../lib/sound";

export function SoundToggle({ className = "" }: { className?: string }) {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(soundCtl.isMuted());
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        soundCtl.resume();
        setMuted(soundCtl.toggle());
      }}
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      className={`size-9 grid place-items-center border-2 border-quest-ink/15 bg-card rounded font-pixel text-base hover:border-primary transition-colors ${className}`}
      title={muted ? "Sound off" : "Sound on"}
    >
      {muted ? "♪̸" : "♪"}
    </button>
  );
}
