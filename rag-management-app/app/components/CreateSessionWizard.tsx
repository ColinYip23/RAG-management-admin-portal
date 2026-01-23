"use client"

import CollapsibleSection from "./CollapsibleSection"
import { useCreateSession } from "../hooks/useCreateSession"

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

      <input
        className="border p-2 w-full
                  text-gray-900 placeholder-gray-400
                  dark:text-gray-100 dark:placeholder-gray-500"
        style={{ borderColor: "var(--border)" }}
        placeholder="Department / Inbox Name"
        value={inboxName}
        onChange={(e) => setInboxName(e.target.value)}
      />

      <button
        onClick={createSession}
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
          <li>Go to Linked Devices</li>
          <li>Tap Link a Device</li>
          <li>Scan the QR</li>
        </ol>
      </div>
    </CollapsibleSection>
  )
}
