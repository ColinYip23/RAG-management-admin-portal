"use client"

import { useRef, useState } from "react"

export function useCreateSession() {
  const [waNumber, setWaNumber] = useState("")
  const [inboxName, setInboxName] = useState("")
  const [qrValue, setQrValue] = useState<string | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const resetForm = () => {
    setWaNumber("")
    setInboxName("")
    setQrValue(null)
    setCreateError(null)
    setCreatingSession(false)
    setSecondsLeft(null)
  }

  const createSession = async (notebooks: string[]) => {
    if (!waNumber || !inboxName) {
      setCreateError("Please enter WhatsApp number and inbox name")
      return
    }

    if (!Array.isArray(notebooks)) {
      setCreateError("Invalid notebook selection")
      return
    }


    try {
      setCreatingSession(true)
      setCreateError(null)
      setQrValue(null)

      const res = await fetch(
        "https://flow2.dlabs.com.my/webhook/session creation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            whatsapp_number: waNumber,
            inbox_name: inboxName,
            notebooks, 
          }),
        }
      )

      if (!res.ok) throw new Error("Failed to create session")

      const data = await res.json()
      setQrValue(data.qr ?? data.value)

      // cleanup old timers
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

      setSecondsLeft(30)

      countdownIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (!prev || prev <= 1) {
            clearInterval(countdownIntervalRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      resetTimerRef.current = setTimeout(resetForm, 30_000)
    } catch (err: any) {
      setCreateError(err.message || "Something went wrong")
    } finally {
      setCreatingSession(false)
    }
  }

  const cleanup = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
  }

  return {
    waNumber,
    inboxName,
    qrValue,
    creatingSession,
    createError,
    secondsLeft,
    setWaNumber,
    setInboxName,
    createSession,
    cleanup,
  }
}
