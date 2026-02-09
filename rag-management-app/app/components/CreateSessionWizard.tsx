"use client"

import { useEffect, useState } from "react"
import { useCreateSession } from "../hooks/useCreateSession"
import { useNotebookSelection } from "../hooks/useNotebookSelection"
import type { UserProfile } from "../hooks/useProfile"
import { supabase } from "@/lib/supabaseClient"

export default function CreateSessionWizard({
  userProfile,
}: {
  userProfile: UserProfile
}){
  const canChooseDepartment = userProfile.role === "admin"

  const [systemPrompt, setSystemPrompt] = useState("")
  const [savingPrompt, setSavingPrompt] = useState(false)

  const {
    waNumber,
    inboxName,
    qrValue,
    creatingSession,
    createError,
    secondsLeft,
    setWaNumber,
    setInboxName,
    createSession,
  } = useCreateSession()

  const {
    notebooks,
    selected,
    selectedNames,
    toggle,
    loading: loadingNotebooks,
  } = useNotebookSelection(inboxName)

  const DEPARTMENTS = [
    "findoc",
    "property",
    "property management",
    "education",
  ]

  async function saveSystemPrompt() {
    if (!waNumber) {
      alert("❌ WhatsApp number is required")
      return
    }

    if (!systemPrompt.trim()) {
      alert("❌ System prompt cannot be empty")
      return
    }

    setSavingPrompt(true)

    try {
      const { error } = await supabase
        .from("waha_sessions")
        .update({
          system_prompt: systemPrompt.trim(),
          modified_at: new Date().toISOString(),
        })
        .eq("WhatsApp", waNumber)

      if (error) throw error

      alert("✅ System prompt saved for WhatsApp session")
    } catch (err: any) {
      console.error("Error saving system prompt:", err)
      alert(`❌ Error: ${err.message || "Failed to save system prompt"}`)
    } finally {
      setSavingPrompt(false)
    }
  }



  useEffect(() => {
    if (userProfile.role === "user" && userProfile.department) {
      setInboxName(userProfile.department)
    }
  }, [userProfile, setInboxName])

  return (
    <div className="space-y-4 bg-white text-black">

      {/* WhatsApp Number */}
      <input
        className="
          w-full p-2
          border border-gray-300 rounded
          bg-white text-black
          placeholder-gray-500
        "
        placeholder="WhatsApp Number"
        value={waNumber}
        onChange={(e) => setWaNumber(e.target.value)}
      />

      {/* Department Select */}
      <div>
        <label className="text-sm font-medium">
          Department
          {!canChooseDepartment && (
            <span className="text-xs opacity-60 ml-2">
              (Fixed to your department)
            </span>
          )}
        </label>

        {canChooseDepartment ? (
          <select
            className="border p-2 w-full rounded"
            value={inboxName}
            onChange={(e) => setInboxName(e.target.value)}
          >
            <option value="" disabled>
              Select Department
            </option>

            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="border p-2 w-full rounded bg-gray-100"
            value={userProfile.department || "No department"}
            disabled
          />
        )}
      </div>


      {/* Notebook Tagging */}
      <div className="border border-gray-300 rounded p-3 space-y-3">
        <h3 className="font-semibold">📚 Notebook Tagging</h3>

        {!inboxName ? (
          <p className="text-sm text-gray-600">
            Enter a department to load notebooks
          </p>
        ) : loadingNotebooks ? (
          <p className="text-sm text-gray-600">
            Loading notebooks…
          </p>
        ) : notebooks.length === 0 ? (
          <p className="text-sm text-gray-600">
            No notebooks available
          </p>
        ) : (
          notebooks.map((nb) => (
            <label
              key={nb.id}
              className="flex items-center gap-2 text-black"
            >
              <input
                type="checkbox"
                checked={selected.includes(nb.id)}
                onChange={() => toggle(nb.id)}
              />
              <span>{nb.title}</span>
            </label>
          ))
        )}
      </div>

      {/* SYSTEM PROMPT SECTION */}
      <div className="border border-gray-300 rounded p-4 bg-gray-50">
        <h4 className="text-sm font-semibold text-black mb-2">System Prompt</h4>
        <textarea
          className="border p-2 w-full rounded bg-white text-black border-gray-300 text-sm"
          rows={4}
          placeholder="Enter system prompt for this notebook..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={saveSystemPrompt}
            disabled={savingPrompt}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 hover:bg-green-700"
          >
            {savingPrompt ? "Saving..." : "Save System Prompt"}
          </button>
        </div>
      </div>

      {/* Create Button */}
      <button
        onClick={() => createSession(selectedNames)}
        disabled={creatingSession}
        className="
          px-4 py-2 rounded
          bg-blue-600 text-white
          hover:bg-blue-700
          disabled:opacity-50
          transition-colors
        "
      >
        {creatingSession ? "Creating session…" : "Create Session"}
      </button>

      {/* Error */}
      {createError && (
        <p className="text-sm text-red-600">
          {createError}
        </p>
      )}

      {/* QR Section */}
      <div className="border border-gray-300 rounded p-3 space-y-2">
        <div className="flex justify-between">
          <h3 className="font-semibold">
            Session Connection
          </h3>
          {secondsLeft !== null && (
            <span className="text-sm text-red-600">
              ⏱ QR expires in {secondsLeft}s
            </span>
          )}
        </div>

        <div className="border border-gray-300 h-64 flex items-center justify-center">
          {qrValue ? (
            <img
              src={`https://quickchart.io/qr?text=${encodeURIComponent(
                qrValue
              )}&size=250&ecLevel=H`}
              alt="WhatsApp QR Code"
              className="rounded shadow"
            />
          ) : (
            <span className="text-sm text-gray-500">
              QR CODE PLACEHOLDER
            </span>
          )}
        </div>

        <ol className="text-sm list-decimal list-inside text-black">
          <li>Open WhatsApp</li>
          <li>Press the Dot Menu</li>
          <li>Go to Linked Devices</li>
          <li>Tap Link a Device</li>
          <li>Scan the QR</li>
        </ol>
      </div>

    </div>
  )
}
