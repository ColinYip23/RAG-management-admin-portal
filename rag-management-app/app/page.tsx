"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import SessionTable from "./components/SessionTable"
import HeaderBar from "./components/HeaderBar"
import { useAuth } from "./hooks/useAuth"
import AuthScreen from "./components/AuthScreen"
import CreateSessionWizard from "./components/CreateSessionWizard"
import { useSessions } from "./hooks/useSessions"
import EditSessionPanel from "./components/EditSessionPanel"
import type { WahaSession } from "@/app/types/WahaSession"
import WarmingUpPanel from "./components/WarmingUpPanel"
import KnowledgeBasePanel from "./components/KnowledgeBasePanel"
import Modal from "./components/Modal"
import { useProfile } from "./hooks/useProfile"


export default function AdminDashboardPage() {
  const [editingSession, setEditingSession] = useState<WahaSession | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("SESSION FROM APP:", data.session)
    })
  }, [])

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const {
    user,
    authLoading,
    email,
    password,
    authError,
    authBusy,
    authMode,
    setEmail,
    setPassword,
    setAuthMode,
    setAuthError,
    setAuthBusy,
    login,
    signup,
  } = useAuth()

  const { profile, loading: profileLoading } = useProfile(user?.email)

  const {
    sessions,
    loading: sessionsLoading,
    refresh: fetchSessions,
    setSessions,
  } = useSessions(profile)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading authentication…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthScreen
        authMode={authMode}
        email={email}
        password={password}
        authBusy={authBusy}
        authError={authError}
        setEmail={setEmail}
        setPassword={setPassword}
        setAuthMode={setAuthMode}
        onSubmit={authMode === "login" ? login : signup}
      />
    )
  }


  return (
    <main className="min-h-screen p-6 space-y-10">

      {/* ========================= */}
      {/* GLOBAL HEADER */}
      {/* ========================= */}
      <HeaderBar
        theme={theme}
        setTheme={setTheme}
      />


      {authError && (
        <p className="text-xs text-red-600 mt-1 text-right">
          {authError}
        </p>
      )}


      {/* ========================= */}
      {/* SESSION LISTING */}
      {/* ========================= */}
      <SessionTable
        sessions={sessions}
        loading={sessionsLoading}
        onRefresh={fetchSessions}
        onEdit={setEditingSession}
        onCreate={() => setCreateOpen(true)}
      />

      {/* ========================= */}
      {/* EDIT SESSION */}
      {/* ========================= */}
      {editingSession && (
        <EditSessionPanel
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSessionUpdate={(updated) => {
            setEditingSession(updated)
            setSessions((prev) =>
              prev.map((s) => (s.id === updated.id ? updated : s))
            )
          }}
        />
      )}


      {/* ========================= */}
      {/* KNOWLEDGE BASE */}
      {/* ========================= */}
      <KnowledgeBasePanel />


      {/* ========================= */}
      {/* WARMING UP NUMBERS */}
      {/* ========================= */}
      <WarmingUpPanel sessions={sessions} />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="🧙 Create WhatsApp Session"
      >
        <CreateSessionWizard />
      </Modal>


    </main>
  )
}