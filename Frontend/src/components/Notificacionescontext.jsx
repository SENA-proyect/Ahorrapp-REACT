// src/components/NotificacionesContext.jsx
import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getNoLeidasCount, getNotificaciones } from '../api';

const NotificacionesContext = createContext();

const INTERVALO_POLLING_MS = 60000; // 60 segundos
const LIMITE_REVISION = 5; // cuantas no leidas recientes se revisan por ciclo

export const NotificacionesProvider = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { mostrarToast } = useToast();
  const [noLeidasCount, setNoLeidasCount] = useState(0);
  const intervaloRef = useRef(null);
  const ultimoIdVistoRef = useRef(null); // null = aun no se ha sincronizado

  const refrescarCount = useCallback(async () => {
    const count = await getNoLeidasCount();
    setNoLeidasCount(count);
  }, []);

  // Revisa las notificaciones no leídas más recientes. Si encuentra IDs
  // nunca vistos, dispara un toast por cada una (con su Mensaje real) y
  // avanza el marcador. En la primera ejecución solo sincroniza en
  // silencio, sin mostrar toasts retroactivos de lo que ya existía.
  const revisarNotificacionesNuevas = useCallback(async () => {
    try {
      const { notificaciones } = await getNotificaciones({ leida: 'false', limit: String(LIMITE_REVISION) });
      if (notificaciones.length === 0) return;

      const idsOrdenadosAsc = [...notificaciones].sort((a, b) => a.id - b.id);
      const esPrimeraSincronizacion = ultimoIdVistoRef.current === null;

      if (!esPrimeraSincronizacion) {
        idsOrdenadosAsc
          .filter((n) => n.id > ultimoIdVistoRef.current)
          .forEach((n) => mostrarToast(n.mensaje, 'info'));
      }

      const idMaximo = idsOrdenadosAsc[idsOrdenadosAsc.length - 1].id;
      ultimoIdVistoRef.current = Math.max(ultimoIdVistoRef.current ?? 0, idMaximo);
    } catch (error) {
      console.error('Error en revisarNotificacionesNuevas:', error);
    }
  }, [mostrarToast]);

  const ejecutarCiclo = useCallback(async () => {
    await refrescarCount();
    await revisarNotificacionesNuevas();
  }, [refrescarCount, revisarNotificacionesNuevas]);

  useEffect(() => {
    // Mientras se resuelve la sesión, o si no hay usuario, no se hace polling.
    if (loading || !isAuthenticated) {
      setNoLeidasCount(0);
      ultimoIdVistoRef.current = null; // se re-sincroniza en el siguiente login
      return;
    }

    // Primera carga inmediata al iniciar sesión.
    ejecutarCiclo();

    intervaloRef.current = setInterval(ejecutarCiclo, INTERVALO_POLLING_MS);

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [isAuthenticated, loading, ejecutarCiclo]);

  const value = {
    noLeidasCount,
    refrescarCount,
  };

  return (
    <NotificacionesContext.Provider value={value}>
      {children}
    </NotificacionesContext.Provider>
  );
};

export const useNotificaciones = () => {
  const context = useContext(NotificacionesContext);
  if (!context) {
    throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  }
  return context;
};