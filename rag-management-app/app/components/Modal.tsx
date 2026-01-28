"use client"

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal container – FORCE LIGHT MODE */}
      <div
        className="
          relative z-10
          w-full max-w-2xl max-h-[90vh] overflow-y-auto
          bg-white text-black
          rounded shadow-xl p-6 space-y-4
          dark:bg-white dark:text-black
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-300 pb-2">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none text-black opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
