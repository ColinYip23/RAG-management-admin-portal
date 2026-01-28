"use client"

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
      <select
        className="
          w-full p-2
          border border-gray-300 rounded
          bg-white text-black
        "
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
