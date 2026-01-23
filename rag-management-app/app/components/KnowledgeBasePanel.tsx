"use client"

import CollapsibleSection from "./CollapsibleSection"

export default function KnowledgeBasePanel() {
  return (
    <CollapsibleSection
      title="Knowledge Base Management"
      icon="📚"
      defaultOpen={false}
    >
      {/* Department Filter */}
      <div className="flex justify-between items-center">
        <select
          className="border px-3 py-1 rounded text-sm"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg)",
            color: "var(--fg)",
          }}
        >
          <option value="">All Departments</option>
          <option value="education">Education</option>
          <option value="property">Property</option>
          <option value="property-mgmt">Property Management</option>
          <option value="fd-team">FD Team</option>
        </select>
      </div>

      {/* ========================= */}
      {/* Notebooks Listing */}
      {/* ========================= */}
      <div
        className="border p-3 rounded space-y-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Notebooks Listing</h3>
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
            + Create Notebook
          </button>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: "var(--card)" }}>
              <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                Title
              </th>
              <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                Created
              </th>
              <th className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Static placeholder rows for now */}
            <tr>
              <td className="border p-2" style={{ borderColor: "var(--border)" }}>
                <div className="font-medium">Education FAQ</div>
                <div className="text-sm opacity-70">Education Dept</div>
              </td>
              <td className="border p-2 text-sm" style={{ borderColor: "var(--border)" }}>
                Jan 15, 2026
              </td>
              <td
                className="border p-2 space-x-2 text-center"
                style={{ borderColor: "var(--border)" }}
              >
                <button className="px-2 py-1 border rounded text-sm">Edit</button>
                <button className="px-2 py-1 border rounded text-sm text-red-600">
                  Delete
                </button>
              </td>
            </tr>

            <tr>
              <td className="border p-2" style={{ borderColor: "var(--border)" }}>
                <div className="font-medium">Property Listings Guide</div>
                <div className="text-sm opacity-70">Property Dept</div>
              </td>
              <td className="border p-2 text-sm" style={{ borderColor: "var(--border)" }}>
                Jan 10, 2026
              </td>
              <td
                className="border p-2 space-x-2 text-center"
                style={{ borderColor: "var(--border)" }}
              >
                <button className="px-2 py-1 border rounded text-sm">Edit</button>
                <button className="px-2 py-1 border rounded text-sm text-red-600">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ========================= */}
      {/* Create Notebook */}
      {/* ========================= */}
      <div
        className="border p-3 rounded space-y-3"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="font-semibold">Create Notebook</h3>

        <input
          className="border p-2 w-full rounded"
          placeholder="Notebook Title"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg)",
            color: "var(--fg)",
          }}
        />

        <select
          className="border p-2 w-full rounded"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg)",
            color: "var(--fg)",
          }}
        >
          <option value="">Select Department</option>
          <option value="education">Education</option>
          <option value="property">Property</option>
          <option value="property-mgmt">Property Management</option>
          <option value="fd-team">FD Team</option>
        </select>

        <div
          className="border-2 border-dashed p-6 rounded text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-sm mb-2">Import Sources</p>
          <p className="text-xs opacity-70 mb-3">
            Drag & drop files here or click to browse
          </p>
          <button className="px-4 py-2 border rounded text-sm">
            Choose Files
          </button>
          <p className="text-xs opacity-60 mt-2">Supported: xls, csv, pdf</p>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            Create & Sync to Vector DB
          </button>
          <button className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </div>

      {/* ========================= */}
      {/* Department Status */}
      {/* ========================= */}
      <div
        className="border p-3 rounded space-y-3"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="font-semibold">Cross-Department Status</h3>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--card)" }}>
              <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                Department
              </th>
              <th className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                Active Notebooks
              </th>
              <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                Last Updated
              </th>
              <th className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                Sync Status
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="border p-2">Education</td>
              <td className="border p-2 text-center">3</td>
              <td className="border p-2">Jan 15, 2026 14:32</td>
              <td className="border p-2 text-center text-green-600">✓ Synced</td>
            </tr>
            <tr>
              <td className="border p-2">Property</td>
              <td className="border p-2 text-center">2</td>
              <td className="border p-2">Jan 12, 2026 09:15</td>
              <td className="border p-2 text-center text-green-600">✓ Synced</td>
            </tr>
            <tr>
              <td className="border p-2">Property Management</td>
              <td className="border p-2 text-center">1</td>
              <td className="border p-2">Jan 10, 2026 16:45</td>
              <td className="border p-2 text-center text-yellow-600">
                ⟳ Syncing…
              </td>
            </tr>
            <tr>
              <td className="border p-2">FD Team</td>
              <td className="border p-2 text-center">0</td>
              <td className="border p-2 opacity-50">—</td>
              <td className="border p-2 text-center opacity-50">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  )
}
