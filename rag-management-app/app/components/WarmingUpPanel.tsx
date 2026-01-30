"use client"

import { useState, useEffect } from "react"
import CollapsibleSection from "./CollapsibleSection"
import type { WahaSession } from "@/app/types/WahaSession"
import { supabase } from "@/lib/supabaseClient"

type Props = {
  sessions: WahaSession[]
}

export default function WarmingUpPanel({ sessions }: Props) {
  const [warmingUpNumbers, setWarmingUpNumbers] = useState<string[]>([])

  /* =========================
     Sync state from DB truth
     start + pause => ticked
     stop => unticked
     ========================= */
  useEffect(() => {
    const activeNumbers = sessions
      .filter(
        (s) => s.warmup === "start" || s.warmup === "pause"
      )
      .map((s) => s.WhatsApp)

    setWarmingUpNumbers(activeNumbers)
  }, [sessions])

  const toggleWarmupNumber = (number: string) => {
    setWarmingUpNumbers((prev) =>
      prev.includes(number)
        ? prev.filter((n) => n !== number)
        : [...prev, number]
    )
  }

  const triggerWarmup = async (
    action: "start" | "pause" | "stop"
  ) => {
    if (warmingUpNumbers.length === 0) return

    try {
      const { error } = await supabase
        .from("waha_sessions")
        .update({ warmup: action })
        .in("WhatsApp", warmingUpNumbers)

      if (error) throw error

      alert(`Warm-up ${action}ed successfully ✅`)
      // UI will resync automatically via sessions prop
    } catch (err) {
      console.error(err)
      alert("Failed to update warm-up status")
    }
  }

  return (
    <CollapsibleSection
      title="Warming Up Numbers"
      icon="🔥"
      defaultOpen={false}
    >
      {/* Numbers list */}
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <p className="text-sm opacity-60">
            No WhatsApp sessions available
          </p>
        ) : (
          sessions.map((s) => {
            const isStarted = s.warmup === "start"
            const isActive =
              s.warmup === "start" || s.warmup === "pause"

            return (
              <label
                key={s.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={
                    isActive ||
                    warmingUpNumbers.includes(s.WhatsApp)
                  }
                  disabled={isStarted}
                  onChange={() =>
                    toggleWarmupNumber(s.WhatsApp)
                  }
                />
                <span className="text-sm">
                  {s.WhatsApp}
                </span>
              </label>
            )
          })
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          disabled={warmingUpNumbers.length === 0}
          className="px-3 py-1 border rounded disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
          onClick={() => triggerWarmup("start")}
        >
          Start
        </button>

        <button
          disabled={warmingUpNumbers.length === 0}
          className="px-3 py-1 border rounded disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
          onClick={() => triggerWarmup("pause")}
        >
          Pause
        </button>

        <button
          disabled={warmingUpNumbers.length === 0}
          className="px-3 py-1 border rounded disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
          onClick={() => triggerWarmup("stop")}
        >
          Stop
        </button>
      </div>
    </CollapsibleSection>
  )
}
