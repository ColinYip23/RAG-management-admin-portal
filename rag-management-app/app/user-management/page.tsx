"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useProfile } from "@/app/hooks/useProfile"
import { useAuth } from "@/app/hooks/useAuth"
import Link from "next/link"

type ProfileRow = {
  id: string
  email: string
  role: "admin" | "user"
  department: string | null
}

const ROLES = ["admin", "user"]
const DEPARTMENTS = [
  "property",
  "property management",
  "education",
  "findoc",
]

export default function UserManagementPage() {
  const { user } = useAuth()
  const { profile, loading } = useProfile(user?.email)

  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)

  // New user form
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "user">("user")
  const [newDepartment, setNewDepartment] = useState<string>("property")

  async function loadProfiles() {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, role, department")
      .order("created_at", { ascending: true })

    setProfiles(data ?? [])
  }

  useEffect(() => {
    document.documentElement.classList.add("dark")
    }, [])

  useEffect(() => {
    if (profile?.role === "admin") {
      loadProfiles()
    }
  }, [profile])

  if (loading) {
    return <p className="p-6">Loading profile…</p>
  }

  if (!profile || profile.role !== "admin") {
    return (
      <p className="p-6 text-red-600">
        ❌ You do not have permission to view this page
      </p>
    )
  }

  async function updateProfile(
    id: string,
    updates: Partial<ProfileRow>
  ) {
    setSavingId(id)

    await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)

    await loadProfiles()
    setSavingId(null)
  }

  return (
    <main className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">
        👤 User Management
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

      {/* USER LIST */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Department</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="border p-2">{p.email}</td>

                <td className="border p-2">
                  <select
                    className="border p-2 rounded w-full"
                    value={p.role}
                    disabled={savingId === p.id}
                    onChange={(e) =>
                      updateProfile(p.id, {
                        role: e.target.value as "admin" | "user",
                      })
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} style={{ backgroundColor: "white", color: "black" }}>{r}</option>
                    ))}
                  </select>
                </td>

                <td className="border p-2">
                  <select
                    className="border p-2 rounded w-full"
                    value={p.department ?? ""}
                    disabled={savingId === p.id}
                    onChange={(e) =>
                      updateProfile(p.id, {
                        department: e.target.value,
                      })
                    }
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} style={{ backgroundColor: "white", color: "black" }}>{d}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

