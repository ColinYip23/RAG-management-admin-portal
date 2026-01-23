"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { WahaSession } from "@/app/types/WahaSession"
import { useSystemPrompt } from "@/app/hooks/useSystemPrompt"
import { useNotebookTagging } from "@/app/hooks/useNotebookTagging"

type Props = {
  session: WahaSession
  onClose: () => void
  onSessionUpdate: (updated: WahaSession) => void
}

export default function EditSessionPanel({
  session,
  onClose,
  onSessionUpdate,
}: Props) {
  const [updatingAgent, setUpdatingAgent] = useState(false)

  const {
    prompt,
    setPrompt,
    savePrompt,
    saving: savingPrompt,
  } = useSystemPrompt(session.WhatsApp)

  const {
    notebooks,
    selected,
    toggle,
    save,
    saving: savingNotebooks,
  } = useNotebookTagging(session.id)

  return (
    <section className="border p-4 rounded space-y-6 dark:border-white-700">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">✏️ Edit Session</h2>
        <button className="text-sm underline" onClick={onClose}>
          Close
        </button>
      </div>

      {/* Session Info */}
      <div className="border p-3 rounded space-y-2">
        <p><b>Account:</b> {session.Account}</p>
        <p><b>WhatsApp:</b> {session.WhatsApp}</p>
        <p><b>Status:</b> {session.Status}</p>
      </div>

      {/* AI Agent */}
      <div className="border p-3 rounded space-y-2">
        <h3 className="font-semibold">🤖 AI Agent Chatbot</h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={session.Enabled === true}
            disabled={updatingAgent}
            onChange={async (e) => {
              const Enabled = e.target.checked
              setUpdatingAgent(true)

              try {
                await supabase
                  .from("waha_sessions")
                  .update({ Enabled })
                  .eq("id", session.id)

                onSessionUpdate({ ...session, Enabled })
              } finally {
                setUpdatingAgent(false)
              }
            }}
          />
          <span>{session.Enabled ? "Enabled" : "Disabled"}</span>
        </label>

        <textarea
          className="w-full border p-2 rounded"
          rows={4}
          placeholder="System prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          disabled={savingPrompt}
          onClick={async () => {
            await savePrompt()
            alert("System prompt saved ✅")
          }}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          {savingPrompt ? "Saving…" : "Save System Prompt"}
        </button>
      </div>

      {/* Notebook Tagging */}
      <div className="border p-3 rounded space-y-3">
        <h3 className="font-semibold">📚 Notebook Tagging</h3>

        {notebooks.length === 0 ? (
          <p className="text-sm opacity-60">No notebooks available</p>
        ) : (
          notebooks.map((nb) => (
            <label key={nb.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(nb.id)}
                onChange={() => toggle(nb.id)}
              />
              <span>{nb.title}</span>
            </label>
          ))
        )}

        <button
          disabled={savingNotebooks || selected.length === 0}
          onClick={async () => {
            await save()
            alert("Notebook tags saved ✅")
          }}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          {savingNotebooks ? "Saving…" : "Save Notebook Tags"}
        </button>
      </div>
    </section>
  )
}
