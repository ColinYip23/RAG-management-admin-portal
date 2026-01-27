"use client"

import CollapsibleSection from "./CollapsibleSection"
import { useCreateSession } from "../hooks/useCreateSession"
import { useNotebookSelection } from "../hooks/useNotebookSelection"

export default function CreateSessionWizard() {
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
    "Findoc",
    "Property",
    "Property Management",
    "Education",
  ]


  return (
    <CollapsibleSection
      title="Create Session Wizard"
      icon="🧙"
      defaultOpen={false}
    >
      <input
        className="border p-2 w-full
                  text-gray-900 placeholder-gray-400
                  dark:text-gray-100 dark:placeholder-gray-500"
        style={{ borderColor: "var(--border)" }}
        placeholder="WhatsApp Number"
        value={waNumber}
        onChange={(e) => setWaNumber(e.target.value)}
      />

      <select
        className="
          border p-2 w-full
          text-gray-900
          dark:text-gray-300
        "
        style={{ borderColor: "var(--border)" }}
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



      {/* Notebook Tagging */}
      <div className="border p-3 rounded space-y-3">
        <h3 className="font-semibold">📚 Notebook Tagging</h3>

        {!inboxName ? (
          <p className="text-sm opacity-60">
            Enter a department to load notebooks
          </p>
        ) : loadingNotebooks ? (
          <p className="text-sm opacity-60">Loading notebooks…</p>
        ) : notebooks.length === 0 ? (
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
      </div>

      <button
        onClick={() => createSession(selectedNames)}
        disabled={creatingSession}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {creatingSession ? "Creating session…" : "Create Session"}
      </button>

      {createError && (
        <p className="text-sm text-red-600">{createError}</p>
      )}

      <div className="border p-3 rounded space-y-2">
        <div className="flex justify-between">
          <h3 className="font-semibold">Session Connection</h3>
          {secondsLeft !== null && (
            <span className="text-sm text-red-600">
              ⏱ QR expires in {secondsLeft}s
            </span>
          )}
        </div>

        <div className="border h-64 flex items-center justify-center">
          {qrValue ? (
            <img
              src={`https://quickchart.io/qr?text=${encodeURIComponent(
                qrValue
              )}&size=250&ecLevel=H`}
              alt="WhatsApp QR Code"
              className="rounded shadow"
            />
          ) : (
            <span className="text-sm opacity-60">QR CODE PLACEHOLDER</span>
          )}
        </div>

        <ol className="text-sm list-decimal list-inside">
          <li>Open WhatsApp</li>
          <li>Press the Dot Menu</li>
          <li>Go to Linked Devices</li>
          <li>Tap Link a Device</li>
          <li>Scan the QR</li>
        </ol>
      </div>
    </CollapsibleSection>
  )
}
