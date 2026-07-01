// src/components/NotificacionesContext.jsx
import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getNoLeidasCount, getNotificaciones } from '../api';

const NotificacionesContext = createContext();

const INTERVALO_POLLING_MS = 60000; // 60 segundos (respaldo, ej. recordatorios del cron)
const LIMITE_REVISION = 5; // cuantas no leidas recientes se revisan por ciclo

export const NotificacionesProvider = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [noLeidasCount, setNoLeidasCount] = useState(0);
  // Notificación pendiente de mostrar como toast anclado a la campana.
  // null = no hay nada pendiente. HeaderModulos la consume y la limpia.
  const [notificacionPendiente, setNotificacionPendiente] = useState(null);
  const intervaloRef = useRef(null);
  const ultimoIdVistoRef = useRef(null); // null = aun no se ha sincronizado

  const refrescarCount = useCallback(async () => {
    const count = await getNoLeidasCount();
    setNoLeidasCount(count);
  }, []);

  const revisarNotificacionesNuevas = useCallback(async () => {
    try {
      const { notificaciones } = await getNotificaciones({ leida: 'false', limit: String(LIMITE_REVISION) });
      if (notificaciones.length === 0) return;

      const idsOrdenadosAsc = [...notificaciones].sort((a, b) => a.id - b.id);
      const esPrimeraSincronizacion = ultimoIdVistoRef.current === null;

      if (!esPrimeraSincronizacion) {
        const nuevas = idsOrdenadosAsc.filter((n) => n.id > ultimoIdVistoRef.current);
        if (nuevas.length > 0) {
          // Solo se muestra una a la vez; si llegaron varias de golpe,
          // se prioriza la más reciente (última del arreglo ordenado asc).
          setNotificacionPendiente(nuevas[nuevas.length - 1]);
        }
      }

      const idMaximo = idsOrdenadosAsc[idsOrdenadosAsc.length - 1].id;
      ultimoIdVistoRef.current = Math.max(ultimoIdVistoRef.current ?? 0, idMaximo);
    } catch (error) {
      console.error('Error en revisarNotificacionesNuevas:', error);
    }
  }, []);

  const ejecutarCiclo = useCallback(async () => {
    await refrescarCount();
    await revisarNotificacionesNuevas();
  }, [refrescarCount, revisarNotificacionesNuevas]);


  const revisarAhora = useCallback(() => {
    ejecutarCiclo();
  }, [ejecutarCiclo]);

  const limpiarNotificacionPendiente = useCallback(() => {
    setNotificacionPendiente(null);
  }, []);

  useEffect(() => {

    if (loading || !isAuthenticated) {
      setNoLeidasCount(0);
      ultimoIdVistoRef.current = null; 
      return;
    }


    ejecutarCiclo();

    intervaloRef.current = setInterval(ejecutarCiclo, INTERVALO_POLLING_MS);

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [isAuthenticated, loading, ejecutarCiclo]);

  const value = {
    noLeidasCount,
    refrescarCount,
    revisarAhora,
    notificacionPendiente,
    limpiarNotificacionPendiente,
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