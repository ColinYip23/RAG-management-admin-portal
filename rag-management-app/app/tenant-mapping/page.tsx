"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"


export default function TenantMappingPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Add form state
  const [newWhatsapp, setNewWhatsapp] = useState("")
  const [newSource, setNewSource] = useState("")

  async function fetchData() {
    setLoading(true)

    const { data: tenantData } = await supabase
      .from("tenant mapping")
      .select("*")

    const { data: sourceData } = await supabase
      .from("rag sources")
      .select("*")

    setTenants(tenantData || [])
    setSources(sourceData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    document.documentElement.classList.add("dark")
    }, [])


  const SOURCE_MAP: Record<string, string> = Object.fromEntries(
    sources.map((s) => [s["RAG source"], s["source name"]])
    )


  const REVERSE_MAP = Object.fromEntries(
    sources.map((s) => [s["source name"], s["RAG source"]])
  )

  async function createMapping() {
    if (!newWhatsapp || !newSource) {
      alert("WhatsApp number and Knowledge Base are required")
      return
    }

    await supabase.from("tenant mapping").insert({
      "WhatsApp number": newWhatsapp,
      "RAG source": REVERSE_MAP[newSource],
    })

    setNewWhatsapp("")
    setNewSource("")
    fetchData()
  }

  async function updateMapping(id: number, sourceName: string) {
    await supabase
      .from("tenant mapping")
      .update({ "RAG source": REVERSE_MAP[sourceName] })
      .eq("id", id)

    fetchData()
  }

  async function deleteMapping(id: number) {
    await supabase
      .from("tenant mapping")
      .delete()
      .eq("id", id)

    fetchData()
  }

  if (loading) {
    return <p className="p-6">Loading tenant mappings…</p>
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
            🗺️ Tenant RAG Mapping Manager
        </h1>

        <Link
            href="/"
            className="
            px-3 py-1
            border rounded
            text-sm
            hover:bg-gray-800
            transition-colors
            "
        >
            ← Back to Dashboard
        </Link>
        </div>


      {/* ADD NEW MAPPING */}
      <details className="border rounded p-4">
        <summary className="cursor-pointer font-medium">
          ➕ Add a new tenant → Knowledge Base mapping
        </summary>

        <div className="mt-4 space-y-3">
          <input
            className="border p-2 rounded w-full"
            placeholder="WhatsApp Number"
            value={newWhatsapp}
            onChange={(e) => setNewWhatsapp(e.target.value)}
          />

          <select
            className="border p-2 rounded w-full"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
          >
            <option value="">Select Knowledge Base</option>
            {Object.values(SOURCE_MAP).map((name) => (
              <option key={name} style={{ backgroundColor: "white", color: "black" }}>{name}</option>
            ))}
          </select>

          <button
            onClick={createMapping}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Create Mapping
          </button>
        </div>
      </details>

      {/* EXISTING MAPPINGS */}
        {tenants.length === 0 ? (
        <p className="opacity-60">No tenants found.</p>
        ) : (
        <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                <th className="border p-2 text-left">
                    WhatsApp
                </th>
                <th className="border p-2 text-left">
                    Knowledge Base
                </th>
                <th className="border p-2 text-center">
                    Action
                </th>
                </tr>
            </thead>

            <tbody>
                {tenants.map((tenant) => {
                const currentSource =
                    SOURCE_MAP[tenant["RAG source"]] ||
                    tenant["RAG source"]

                return (
                    <tr key={tenant.id}>
                    {/* WhatsApp */}
                    <td className="border p-2 font-medium">
                        {tenant["WhatsApp number"]}
                    </td>

                    {/* Mapping dropdown */}
                    <td className="border p-2">
                        <select
                        className="border p-2 rounded w-full"
                        value={currentSource}
                        onChange={(e) =>
                            updateMapping(tenant.id, e.target.value)
                        }
                        >
                        {Object.values(SOURCE_MAP).map((name) => (
                            <option
                            key={name}
                            style={{
                                backgroundColor: "white",
                                color: "black",
                            }}
                            >
                            {name}
                            </option>
                        ))}
                        </select>
                    </td>

                    {/* Delete */}
                    <td className="border p-2 text-center">
                        <button
                        onClick={() => {
                            if (
                            confirm(
                                "This will permanently delete this mapping. Continue?"
                            )
                            ) {
                            deleteMapping(tenant.id)
                            }
                        }}
                        className="
                            bg-red-600
                            text-white
                            px-3 py-1
                            rounded
                            text-sm
                            hover:bg-red-700
                        "
                        >
                        🗑️ Delete
                        </button>
                    </td>
                    </tr>
                )
                })}
            </tbody>
            </table>
        </div>
        )}

    </main>
  )
}
