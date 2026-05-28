import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // 👈 Importamos Framer Motion
import { useTheme } from './../../../hooks/useTheme'

// ─────────────────────────────────────────────────────────
// API (ajusta la ruta según tu proyecto)
// ─────────────────────────────────────────────────────────
const getResumenFinancieroBreve = async () => {
  // 👉 Reemplaza con tu llamada real a la API
  return 'Resumen financiero disponible.'
}

// ─────────────────────────────────────────────────────────
// COMPONENTE ASISTENTE
// ─────────────────────────────────────────────────────────
const Asistente = () => {
  const { isDarkMode } = useTheme()
  
  const [visible, setVisible] = useState(false)
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      content: '¡Hola! Soy el asistente de AhorrApp. ¿En qué puedo ayudarte con tus finanzas hoy?' 
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, visible])

  // ─────────────────────────────────────────────────────
  // Enviar mensaje
  // ─────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = { role: 'user', content: input.trim() }
    const newHistory = [...messages, userMessage]
    
    setMessages(newHistory)
    setInput('')
    setIsLoading(true)

    try {
      const contextoFinanciero = await getResumenFinancieroBreve()

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.slice(-5),
          system: `Eres un asistente financiero amable y conciso de la app AhorraPP.
                  Tienes acceso a los datos financieros del usuario, pero SOLO los menciones 
                  si el usuario te pregunta explícitamente por ellos.
                  Si el usuario hace preguntas generales, responde de forma general SIN mencionar sus datos.
                  Cuando sí necesites los datos, aquí están: ${contextoFinanciero}
                  Usa estos datos para dar consejos personalizados. Responde de forma breve y amable.`
        })
      })

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'bot',
        content: data.reply || 'Lo siento, tuve un problema al procesar tu respuesta.'
      }])
    } catch (e) {
      console.error('Error en el asistente:', e)
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Error de conexión con el servidor.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Enter para enviar (sin Shift)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─────────────────────────────────────────────────────
  // ANIMACIONES CON FRAMER MOTION
  // ─────────────────────────────────────────────────────

  // Animación del contenedor del chat (efecto de aparición)
  const chatVariants = {
    hidden: {
      opacity: 0,
      scale: 0.85,
      rotateX: -15,
      y: 30,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 28,
        mass: 0.8
      }
    },
    exit: {
      opacity: 0,
      scale: 0.85,
      rotateX: -15,
      y: 30,
      transition: { duration: 0.2, ease: 'easeIn' }
    }
  }

  // Animación escalonada para los mensajes
  const messagesContainerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const messageVariants = {
    hidden: (role) => ({
      opacity: 0,
      x: role === 'user' ? 20 : -20,
      scale: 0.9
    }),
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
        duration: 0.3
      }
    }
  }

  // Animación del botón flotante
  const fabVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.08, rotate: 5, transition: { type: 'spring', stiffness: 400 } },
    tap: { scale: 0.92, rotate: -5, transition: { duration: 0.1 } },
    open: { rotate: 45, scale: 1.05 }
  }

  // Animación del indicador "Escribiendo..."
  const typingVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { repeat: Infinity, repeatType: 'reverse', duration: 0.6 } }
  }

  return (
    <div className="fixed bottom-[18px] right-[18px] z-[9999] flex flex-col items-end gap-[14px] w-fit h-fit pointer-events-none font-sans">
      
      {/* ───────── CONTENEDOR DEL CHAT (animado) ───────── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            variants={chatVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformStyle: 'preserve-3d' }}
            className={`
              w-[360px] h-[476px] rounded-[22px] 
              flex flex-col overflow-hidden 
              border backdrop-blur-[12px]
              origin-bottom-right
              pointer-events-auto
              ${isDarkMode 
                ? 'bg-gradient-to-b from-[#131a31] to-[#0f1630] border-white/8 shadow-[0_24px_70px_rgba(0,0,0,0.34)]' 
                : 'bg-gradient-to-b from-[#f3f4f6] to-[#e5e7eb] border-black/10 shadow-[0_24px_70px_rgba(0,0,0,0.08)]'
              }
            `}
          >
            {/* HEADER */}
            <div className={`
              px-[18px] py-4 flex items-center gap-3
              ${isDarkMode ? 'bg-gradient-to-br from-[#101d35] to-[#16213e]' : 'bg-gradient-to-br from-[#e0e7ff] to-[#dbeafe]'}
            `}>
              {/* Dot de estado animado */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className={`
                  w-[10px] h-[10px] rounded-full flex-shrink-0
                  ${isDarkMode 
                    ? 'bg-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.45)]' 
                    : 'bg-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.45)]'
                  }
                `} 
              />
              
              {/* Título */}
              <h3 className={`
                m-0 text-[1rem] font-bold tracking-wide flex-1 truncate
                ${isDarkMode ? 'text-[#f8fafc]' : 'text-[#1e40af]'}
              `}>
                Asistente AhorraPP
              </h3>
              
              {/* Botón cerrar */}
              <motion.button 
                onClick={() => setVisible(false)}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  w-9 h-9 rounded-full grid place-items-center 
                  text-[18px] opacity-95 cursor-pointer
                  transition-all duration-200
                  ${isDarkMode 
                    ? 'bg-white/8 text-[#f8fafc] hover:bg-white/15' 
                    : 'bg-black/8 text-[#1e40af] hover:bg-black/12'
                  }
                `}
                aria-label="Cerrar asistente"
              >
                ✕
              </motion.button>
            </div>

            {/* MENSAJES con stagger */}
            <motion.div 
              variants={messagesContainerVariants}
              initial="hidden"
              animate="visible"
              className={`
                flex-1 p-[18px_18px_12px] overflow-y-auto 
                flex flex-col gap-3
                ${isDarkMode 
                  ? 'bg-gradient-to-b from-[#0f162d] to-[#0b1021]' 
                  : 'bg-gradient-to-b from-[#f9fafb] to-[#f3f4f6]'
                }
              `}
            >
              {messages.map((msg, index) => (
                <motion.div 
                  key={index} 
                  custom={msg.role}
                  variants={messageVariants}
                  className={`
                    max-w-[86%] break-words word-wrap
                    ${msg.role === 'user' ? 'self-end' : 'self-start'}
                  `}
                >
                  <div className={`
                    px-4 py-[13px] rounded-[18px] 
                    text-[0.92rem] leading-[1.58] whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? (isDarkMode 
                          ? 'bg-[#0f3460] text-[#fff9d1] rounded-br-[6px] shadow-[0_18px_36px_rgba(15,52,96,0.32)]' 
                          : 'bg-[#3b82f6] text-white rounded-br-[6px] shadow-[0_18px_36px_rgba(59,130,246,0.25)]'
                        )
                      : (isDarkMode 
                          ? 'bg-white/6 text-[#dce7ff] border border-white/8 rounded-bl-[6px]' 
                          : 'bg-white text-[#1f2937] border border-gray-200 rounded-bl-[6px]'
                        )
                    }
                  `}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    variants={typingVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className={`
                      text-[0.84rem] italic ml-1
                      ${isDarkMode ? 'text-[#ffd700]' : 'text-[#f59e0b]'}
                    `}
                  >
                    Escribiendo...
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </motion.div>

            {/* INPUT AREA */}
            <div className={`
              px-[18px] py-[14px_18px_18px] 
              flex gap-[10px] border-t
              ${isDarkMode 
                ? 'bg-[#0b1224] border-white/8' 
                : 'bg-[#f9fafb] border-black/10'
              }
            `}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Consulta tus dudas financieras..."
                rows={1}
                className={`
                  flex-1 border rounded-[999px] px-[18px] py-3 
                  resize-none outline-none text-[0.94rem] max-h-[120px] 
                  font-inherit
                  transition-all duration-200
                  ${isDarkMode 
                    ? 'border-white/12 bg-white/4 text-[#f8fafc] placeholder:text-white/55 focus:border-[#ffd700] focus:ring-3 focus:ring-[#ffd700]/12' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#f59e0b] focus:ring-3 focus:ring-[#f59e0b]/20'
                  }
                `}
              />
              <motion.button 
                onClick={sendMessage} 
                disabled={isLoading}
                whileHover={{ scale: 1.08, boxShadow: '0 0 12px rgba(255,215,0,0.5)' }}
                whileTap={{ scale: 0.92 }}
                className={`
                  w-11 h-11 rounded-full 
                  flex items-center justify-center 
                  cursor-pointer flex-shrink-0
                  transition-all duration-200
                  ${isLoading 
                    ? 'bg-[#64748b] cursor-not-allowed' 
                    : (isDarkMode 
                        ? 'bg-gradient-to-br from-[#ffd700] to-[#f2c94c] text-[#1a1a2e]' 
                        : 'bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] text-[#1a1a2e]'
                      )
                  }
                `}
                aria-label="Enviar mensaje"
              >
                ➤
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── BOTÓN FLOTANTE (con animación de apertura/cierre) ───────── */}
      <motion.button 
        onClick={() => setVisible(v => !v)}
        variants={fabVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        animate={visible ? "open" : "idle"}
        className={`
          w-[58px] h-[58px] rounded-full 
          flex items-center justify-center 
          text-[24px] cursor-pointer
          border-none
          shadow-[0_16px_44px_rgba(255,209,35,0.28)]
          pointer-events-auto
          ${isDarkMode 
            ? 'bg-gradient-to-br from-[#ffd700] to-[#f2c94c] text-[#1a1a2e]' 
            : 'bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] text-[#1a1a2e]'
          }
        `}
        aria-label={visible ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        <motion.span
          animate={{ rotate: visible ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {visible ? '✕' : '💬'}
        </motion.span>
      </motion.button>
    </div>
  )
}

export default Asistente