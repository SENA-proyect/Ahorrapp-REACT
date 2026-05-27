// src/hooks/useTheme.js
import { useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'ahorrapp-theme'

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) return saved !== 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Sincronizar cambios desde otras pestañas o componentes
  useEffect(() => {
    const sync = () => {
      const theme = localStorage.getItem(THEME_KEY)
      const next = theme ? theme !== 'light' : window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(next)
      document.documentElement.classList.toggle('dark', next)
    }

    window.addEventListener('theme-changed', sync)
    window.addEventListener('storage', sync) // Sync entre pestañas
    return () => {
      window.removeEventListener('theme-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const next = !isDarkMode
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
    window.dispatchEvent(new CustomEvent('theme-changed'))
    setIsDarkMode(next)
  }, [isDarkMode])

  return { isDarkMode, toggleTheme }
}