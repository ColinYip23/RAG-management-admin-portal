"use client"
import { useState } from "react"

export default function CollapsibleSection({
    title,
    icon,
    defaultOpen = false,
    children,
  }: {
    title: string
    icon?: string
    defaultOpen?: boolean
    children: React.ReactNode
  }) {
    const [open, setOpen] = useState(defaultOpen)

    return (
      <section
        className="border p-4 rounded"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setOpen((prev) => !prev)}
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {title}
          </h2>

          {/* Minimal arrow */}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Animated body */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            open ? "max-h-[1500px] opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-4">{children}</div>
        </div>
      </section>
    )
  }