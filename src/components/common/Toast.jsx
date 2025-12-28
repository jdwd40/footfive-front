import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ message, type, onClose }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const typeStyles = {
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    success: 'bg-green-500/20 border-green-500/50 text-green-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    goal: 'bg-primary/20 border-primary/50 text-primary'
  }

  const icons = {
    info: 'ℹ️',
    success: '✓',
    error: '✕',
    goal: '⚽'
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
        transition-all duration-300 ease-out
        ${typeStyles[type]}
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}
    >
      <span className="text-lg">{icons[type]}</span>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}

