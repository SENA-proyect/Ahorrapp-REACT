import React, { useState, useEffect, useRef } from 'react';
import '../../styles/asistente.css';
import { getResumenFinancieroBreve } from '../../api';

const Asistente = () => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: '¡Hola! Soy el asistente de AhorraPP. ¿En qué puedo ayudarte con tus finanzas hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const contextoFinanciero = await getResumenFinancieroBreve();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.slice(-5),
          system: `Eres un asistente financiero amable y conciso de la app AhorraPP.
                  Tienes acceso a los datos financieros del usuario, pero SOLO los menciones si el usuario te pregunta explícitamente por ellos (por ejemplo: "cuánto debo", "cuáles son mis gastos", "cómo voy con mis ahorros").
                  Si el usuario hace preguntas generales o de consejos, responde de forma general SIN mencionar sus datos.
                  Cuando sí necesites los datos, aquí están:
                  ${contextoFinanciero}
                  Usa estos datos para dar consejos personalizados. Responde de forma breve y amable.`
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'bot',
        content: data.reply || "Lo siento, tuve un problema al procesar tu respuesta."
      }]);
    } catch (e) {
      console.error("Error en el asistente:", e);
      setMessages(prev => [...prev, { role: 'bot', content: "Error de conexión con el servidor." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="asistente-wrapper">
      {/* Chat */}
      <div className={`asistente-container ${visible ? '' : 'oculto'}`}>
        <div className="asistente-header">
          <div className="status-dot"></div>
          <h3>Asistente AhorraPP</h3>
          <button className="cerrar-btn" onClick={() => setVisible(false)}>✕</button>
        </div>

        <div className="asistente-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`asistente-msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
              <div className="bubble">{msg.content}</div>
            </div>
          ))}
          {isLoading && <div className="typing">Escribiendo...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="asistente-input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Consulta tus dudas financieras..."
            rows="1"
          />
          <button onClick={sendMessage} disabled={isLoading}>➤</button>
        </div>
      </div>

      {/* Botón flotante */}
      <button className="asistente-toggle-btn" onClick={() => setVisible(v => !v)}>
        {visible ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default Asistente;