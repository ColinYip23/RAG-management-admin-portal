"use client"

import { useState } from "react"
import CollapsibleSection from "./CollapsibleSection"
import type { WahaSession } from "@/app/types/WahaSession"

type Props = {
  sessions: WahaSession[]
}

export default function WarmingUpPanel({ sessions }: Props) {
  const [warmingUpNumbers, setWarmingUpNumbers] = useState<string[]>([])

  const toggleWarmupNumber = (number: string) => {
    setWarmingUpNumbers((prev) =>
      prev.includes(number)
        ? prev.filter((n) => n !== number)
        : [...prev, number]
    )
  }

  const triggerWarmup = async (action: "start" | "pause" | "stop") => {
    try {
      const res = await fetch(
        "https://flow2.dlabs.com.my/webhook-test/warmup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            numbers: warmingUpNumbers,
          }),
        }
      )

      if (!res.ok) throw new Error("Failed to trigger warm-up")

      alert(`Warm-up ${action}ed successfully ✅`)
    } catch (err) {
      console.error(err)
      alert("Failed to trigger warm-up")
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
          sessions.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={warmingUpNumbers.includes(s.WhatsApp)}
                onChange={() => toggleWarmupNumber(s.WhatsApp)}
              />
              <span className="text-sm">{s.WhatsApp}</span>
            </label>
          ))
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
