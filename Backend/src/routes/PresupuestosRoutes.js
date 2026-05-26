const router     = require('express').Router();
const ctrl       = require('../controllers/PresupuestosController');
const authMiddleware = require('../middlewares/auth'); 

router.use(authMiddleware); 

// ── Perfiles de presupuesto ──────────────────────────────────
router.get   ('/',               ctrl.listarPerfiles);  
router.get   ('/:id',            ctrl.obtenerPerfil);   
router.post  ('/',               ctrl.crearPerfil);     
router.put   ('/:id',            ctrl.editarPerfil);    
router.delete('/:id',            ctrl.eliminarPerfil); 
router.put   ('/:id/activar',    ctrl.activarPerfil);  

// ── Períodos ─────────────────────────────────────────────────
router.get   ('/periodos',           ctrl.listarPeriodos);       // GET   /presupuestos/periodos
router.get   ('/periodos/activo',    ctrl.obtenerPeriodoActivo); // GET   /presupuestos/periodos/activo
router.post  ('/periodos/abrir',     ctrl.abrirPeriodo);         // POST  /presupuestos/periodos/abrir
router.put   ('/periodos/cerrar',    ctrl.cerrarPeriodo);        // PUT   /presupuestos/periodos/cerrar
router.patch ('/periodos/ajustar-ingreso', ctrl.ajustarIngresoPeriodo); // PATCH /presupuestos/periodos/ajustar-ingreso

module.exports = router;