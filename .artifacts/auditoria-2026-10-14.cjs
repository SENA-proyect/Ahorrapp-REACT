const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const req = createRequire(path.join(root, 'Backend/package.json'));
const express = req('express');
const jwt = req('jsonwebtoken');
const { fixture } = req('./tests/rf19-fixture.cjs');
const results = [];
const logs = [];
const originalError = console.error;
console.error = (...args) => logs.push(args.map(x => x?.message || String(x)).join(' '));
const check = async (name, expected, action) => {
  try { const actual = await action(); results.push({ name, expected, actual, passed: JSON.stringify(actual) === JSON.stringify(expected) }); }
  catch (error) { results.push({ name, expected, error: error.message, passed: false }); }
};
const inject = (file, exports) => { const id = req.resolve(file); require.cache[id] = { id, filename: id, loaded: true, exports }; };
(async () => {
  const db = await fixture();
  let server;
  try {
    const sql = fs.readFileSync(path.join(root, 'SQL/supabase.sql'), 'utf8');
    const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS[\s\S]*?\n\);/g)].map(x => x[0]);
    await check('SQL/supabase.sql: primera tabla instala sin error', 'OK', async () => {
      // Un esquema nuevo impide que IF NOT EXISTS oculte errores del archivo.
      await db.pool.query('CREATE SCHEMA audit_original');
      const client = await db.pool.connect();
      try { await client.query('SET search_path TO audit_original'); await client.query(tables[0]); return 'OK'; }
      finally { await client.query('SET search_path TO public'); client.release(); }
    });
    await db.pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    for (const match of sql.matchAll(/CREATE TYPE \w+ AS ENUM\s*\([\s\S]*?\);/g)) await db.pool.query(match[0]);
    // Solo la copia de prueba recibe la coma que falta, para auditar el resto.
    for (let i = 0; i < tables.length; i++) await db.pool.query(i ? tables[i] : tables[i].replace('fecha_eliminacion_programada TIMESTAMP NULL', 'fecha_eliminacion_programada TIMESTAMP NULL,'));
    for (const match of sql.matchAll(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$\s*(?:LANGUAGE\s+\w+\s*)?;/g)) await db.pool.query(match[0]);
    for (const match of sql.matchAll(/CREATE TRIGGER[\s\S]*?;/g)) await db.pool.query(match[0]);
    for (const match of sql.matchAll(/^CREATE(?: UNIQUE)? INDEX[\s\S]*?;/gm)) await db.pool.query(match[0]);
    await db.pool.query(`INSERT INTO usuarios(id_usuario,nombre,apellido,email,password_hash) VALUES
      (7,'Cuenta','Siete','account7@test.invalid','not-used'),(8,'Cuenta','Ocho','account8@test.invalid','not-used');
      INSERT INTO rol(id_rol,cargo) VALUES (1,'user'),(2,'admin'),(3,'superuser');
      INSERT INTO usuarios_roles VALUES (7,1),(8,1);
      INSERT INTO categorias(id_usuario,nombre,activa) VALUES (7,'Personal',true),(8,'Ajena',true),(7,'Inactiva',false);
      INSERT INTO dependientes(id_usuario,nombre,relacion) VALUES (7,'Propio','Hijo'),(8,'Ajeno','Hijo');
      SELECT setval('usuarios_id_usuario_seq',8);`);
    inject('./src/service/MailService', { sendResetCodeEmail: async () => {} });
    const app = express(); app.use(express.json());
    const mounts = [['movimientos','movimientosRoutes'],['auth','authRoutes'],['categorias','categoriasRoutes'],['dependientes','dependientesRoutes'],['fondo-emergencia','fondoemergenciaRoutes'],['reportes','ReportesRoutes'],['dashboard','dashboardRoutes'],['historial','Historialroutes']];
    // Recupera presupuestos reales para su propia API; los efectos auxiliares
    // de movimientos siguen siendo los sustitutos de la fixture.
    delete require.cache[req.resolve('./src/controllers/PresupuestosController')];
    delete require.cache[req.resolve('./src/service/NotificacionesService')];
    mounts.push(['presupuestos','PresupuestosRoutes']);
    for (const [prefix,file] of mounts) app.use('/api/' + prefix, req('./src/routes/' + file));
    app.use('/api', req('./src/routes/NotificacionesRoutes'));
    server = await new Promise(resolve => { const s = app.listen(0,'127.0.0.1',()=>resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const request = async (route, body, method = body === undefined ? 'GET' : 'POST', owner = 7, token = db.token(owner)) => {
      const response = await fetch(base + route, { method, headers: { 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) }, ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal:AbortSignal.timeout(15000) });
      const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text.slice(0,150); }
      return {status:response.status,body:data};
    };
    const status = (...args) => request(...args).then(x=>x.status);
    const movement = (type, fields = {}) => ({ tipo_flujo:['Ingreso','Ahorro'].includes(type)?'Entrada':'Salida', subtipo_modulo:type, datos:{ monto:1000,descripcion:'Prueba aislada',fuente:'Banco',meta:'Viaje',cuotas_total:10,fecha_inicio:'2026-10-01',fecha_fin:'2026-12-01',fecha_registro:'2026-10-14',id_categoria:1,...fields } });
    const records = {};
    for (const type of ['Ingreso','Gasto','Ahorro','Imprevisto','Deuda']) await check('Crear válido '+type,201,async()=>{const r=await request('/movimientos',movement(type));records[type]=r.body.ID_detalle;return r.status;});
    const reports = ['/resumen','/gastos/categorias','/gastos/dependientes','/ingresos/categorias','/ingresos/fuentes','/ahorros','/deudas','/imprevistos/categorias','/fondo-emergencia','/evolucion','/ahorros/estado','/deudas/estado','/fondo-emergencia/estado'];
    for (const route of reports) await check('Reporte '+route,route.startsWith('/fondo-emergencia')?404:200,()=>status('/reportes'+route+'?fecha_inicio=2026-10-01&fecha_fin=2026-10-31'));
    for (const route of ['/movimientos','/movimientos/ingresos','/movimientos/gastos','/movimientos/ahorros','/movimientos/imprevistos','/movimientos/deudas','/categorias','/dependientes','/dashboard/resumen','/dashboard/presupuesto-vs-ejecutado','/dashboard/flujo-semanal','/historial/propio','/presupuestos','/presupuestos/periodos','/notificaciones']) {
      await check('GET autenticado '+route,200,()=>status(route));
      await check('GET sin token '+route,401,()=>status(route,undefined,'GET',7,null));
      await check('GET vencido '+route,403,()=>status(route,undefined,'GET',7,db.token(7,true)));
    }
    for (const route of ['/auth/PanelUsuarios','/auth/PanelDependientes','/auth/usuarios/PanelAdmin','/auth/dependientes/PanelAdmin']) await check('Usuario normal bloqueado en '+route,403,()=>status(route));
    const reset = jwt.sign({id:7,purpose:'reset_password'},process.env.JWT_SECRET,{expiresIn:'10m'});
    await check('Token de recuperación no autoriza gastos',403,()=>status('/movimientos/gastos',undefined,'GET',7,reset));
    const plurals = {Ingreso:'ingresos',Gasto:'gastos',Ahorro:'ahorros',Imprevisto:'imprevistos',Deuda:'deudas'};
    for (const [type,plural] of Object.entries(plurals)) {
      const fields = {...movement(type).datos,monto_acumulado:0,cuotas_pagadas:0,estado:'pendiente'};
      await check('Editar rechaza categoría ajena '+type,400,()=>status(`/movimientos/${plural}/${records[type]}`,{...fields,id_categoria:2},'PUT'));
      await check('Editar rechaza categoría inactiva '+type,400,()=>status(`/movimientos/${plural}/${records[type]}`,{...fields,id_categoria:3},'PUT'));
      await check('Otra cuenta no edita '+type,404,()=>status(`/movimientos/${plural}/${records[type]}`,fields,'PUT',8));
      await check('Otra cuenta no elimina '+type,404,()=>status(`/movimientos/${plural}/${records[type]}`,undefined,'DELETE',8));
      if (['Gasto','Imprevisto'].includes(type)) await check('Editar rechaza dependiente ajeno '+type,400,()=>status(`/movimientos/${plural}/${records[type]}`,{...fields,id_dependientes:2},'PUT'));
      await status(`/movimientos/${plural}/${records[type]}`,fields,'PUT');
    }
    await check('Crear imprevisto rechaza dependiente ajeno',400,()=>status('/movimientos',movement('Imprevisto',{id_dependientes:2})));
    for (const type of Object.keys(plurals)) for (const value of [0,-1,null,'','abc',true,[1],{},'NaN','Infinity',1e100]) await check(`Monto inválido ${type} ${JSON.stringify(value)}`,400,()=>status('/movimientos',movement(type,{monto:value})));
    for (const type of Object.keys(plurals)) for (const value of ['no-fecha','2026-02-30','2026-13-01','2026-00-10']) await check(`Fecha inválida ${type} ${value}`,400,()=>status('/movimientos',movement(type,{fecha_registro:value,fecha_inicio:value})));
    await check('Abono ahorro rechaza NaN',400,()=>status(`/movimientos/ahorros/${records.Ahorro}/abonar`,{monto:'NaN'},'PATCH'));
    for (const cuotas of [0,'abc',1.8,'1abc']) await check('Cuotas inválidas '+cuotas,400,()=>status(`/movimientos/deudas/${records.Deuda}/abonar`,{cuotas},'PATCH'));
    await check('Crear fondo',201,()=>status('/fondo-emergencia',{meta:1000}));
    await check('Aporte fondo',201,()=>status('/fondo-emergencia/aporte',{monto:500}));
    for(const route of ['/fondo-emergencia','/fondo-emergencia/estado']) await check('Reporte con fondo creado '+route,200,()=>status('/reportes'+route+'?fecha_inicio=2026-10-01&fecha_fin=2026-10-31'));
    await check('Retiro fondo con saldo suficiente',201,()=>status('/fondo-emergencia/retiro',{monto:100}));
    await check('Retiro excesivo se rechaza',400,()=>status('/fondo-emergencia/retiro',{monto:10000}));
    await check('Dependiente sin peso usa default de la BD',201,()=>status('/dependientes',{Nombre:'Hijo',Relacion:'Hijo',Fecha_nacimiento:'2010-01-01'}));
    await check('Registro rechaza correo inválido y password débil',400,()=>status('/auth/register',{Nombre:'Prueba',Apellido:'Local',Email:'correo-invalido',Password_hash:'x'}));
    await check('Login sin contraseña no produce 500',400,()=>status('/auth/login',{Email:'account7@test.invalid'}));
    await check('Cuenta desactivada pierde acceso con JWT anterior',403,async()=>{await db.pool.query('UPDATE usuarios SET activo=false WHERE id_usuario=8');return status('/movimientos/ingresos',undefined,'GET',8);});
    await db.pool.query('UPDATE usuarios SET activo=true WHERE id_usuario=8');
    db.setFailEffects(true);
    await check('Notificación fallida no cambia abono confirmado a 500',200,()=>status(`/movimientos/ahorros/${records.Ahorro}/abonar`,{monto:25},'PATCH'));
    db.setFailEffects(false);
    await check('Persistencia del abono después del error auxiliar',25,async()=>Number((await db.pool.query('SELECT monto_acumulado FROM ahorros WHERE id_ahorros=$1',[records.Ahorro])).rows[0].monto_acumulado));
    // Más casos de concurrencia, recuperación y ciclo de presupuesto.
    const duplicates=await Promise.all(Array.from({length:24},(_,i)=>request('/categorias',{nombre:i%2?'  prueba concurrente  ':'PRUEBA CONCURRENTE'})));
    await check('24 creaciones categoría: una sola nueva',1,async()=>duplicates.filter(x=>x.status===201).length);
    await check('24 creaciones categoría: 23 duplicados rechazados',23,async()=>duplicates.filter(x=>x.status===409).length);
    const profile=await request('/presupuestos',{Nombre:'Auditoría'});
    await check('Crear perfil presupuesto',201,async()=>profile.status);
    await check('Activar perfil presupuesto',200,()=>status('/presupuestos/'+profile.body.ID_presupuesto+'/activar',{},'PUT'));
    for(const fields of [{Porcentaje_gastos:-10,Porcentaje_deudas:70},{Porcentaje_gastos:'abc'},{Dia_corte:1.5}]) await check('Presupuesto inválido '+JSON.stringify(fields),400,()=>status('/presupuestos',{Nombre:'Inválido',...fields}));
    await check('Abrir período presupuesto',201,()=>status('/presupuestos/periodos/abrir',{ingreso_estimado:10000}));
    await check('Reabrir período se rechaza',true,async()=>[400,409].includes(await status('/presupuestos/periodos/abrir',{ingreso_estimado:10000})));
    await check('Cerrar período presupuesto',200,()=>status('/presupuestos/periodos/cerrar',{},'PUT'));
    const openings=await Promise.all(Array.from({length:20},()=>request('/presupuestos/periodos/abrir',{ingreso_estimado:10000})));
    await check('20 aperturas simultáneas: solo un período abierto',1,async()=>Number((await db.pool.query("SELECT COUNT(*) FROM periodos_presupuesto WHERE id_usuario=7 AND estado='abierto'")).rows[0].count));
    await check('20 aperturas simultáneas: solo una respuesta de creación',1,async()=>openings.filter(x=>x.status===201).length);
    await db.pool.query('UPDATE ahorros SET monto_acumulado=0 WHERE id_ahorros=$1',[records.Ahorro]);
    await db.pool.query('DELETE FROM abonos_ahorro WHERE id_ahorros=$1',[records.Ahorro]);
    const payments=await Promise.all(Array.from({length:20},()=>request(`/movimientos/ahorros/${records.Ahorro}/abonar`,{monto:100},'PATCH')));
    await check('20 abonos simultáneos no superan meta',1000,async()=>Number((await db.pool.query('SELECT monto_acumulado FROM ahorros WHERE id_ahorros=$1',[records.Ahorro])).rows[0].monto_acumulado));
    await check('20 abonos simultáneos: diez confirmados',10,async()=>payments.filter(x=>x.status===200).length);
    await check('Paginación con límite negativo se rechaza',400,()=>status('/presupuestos/periodos?limite=-1'));
    const replayToken=jwt.sign({id:7,purpose:'reset_password'},process.env.JWT_SECRET,{expiresIn:'10m'});
    await check('Primer cambio con token recuperación',200,()=>status('/auth/reset-password',{resetToken:replayToken,nuevaPassword:'Password-Audit-1!'}));
    await check('Token recuperación consumido no puede reutilizarse',401,()=>status('/auth/reset-password',{resetToken:replayToken,nuevaPassword:'Password-Audit-2!'}));
    console.log('Pruebas funcionales completadas; comenzando matriz de identificadores inválidos.');
    // 2048 entradas únicas, repartidas entre tipos de movimientos y consulta
    // de sincronización; todas deben rechazarse antes de escribir.
    const before = Number((await db.pool.query('SELECT COUNT(*) FROM movimientos')).rows[0].count);
    for (let offset=0;offset<2048;offset+=16) await Promise.all(Array.from({length:16},(_,j)=>{
      const i=offset+j; const id=`invalid-operation-${i.toString(16).padStart(8,'0')}`;
      const type=Object.keys(plurals)[i%5];
      return check(`UUID inválido #${i}`,400,()=>i%2?status('/movimientos',{...movement(type),operation_id:id}):status('/movimientos/sincronizacion/operaciones/'+id));
    }));
    await check('Matriz inválida no escribe movimientos',before,async()=>Number((await db.pool.query('SELECT COUNT(*) FROM movimientos')).rows[0].count));
    const {randomUUID}=require('node:crypto');
    const body={...movement('Ingreso'),operation_id:randomUUID()};
    const concurrent=await Promise.all(Array.from({length:100},()=>request('/movimientos',body)));
    await check('100 reintentos simultáneos: exactamente un INSERT',1,async()=>concurrent.filter(x=>x.status===201).length);
    await check('100 reintentos simultáneos: respuestas exitosas',100,async()=>concurrent.filter(x=>[200,201].includes(x.status)).length);
    await check('100 reintentos simultáneos: ID único',1,async()=>new Set(concurrent.map(x=>x.body.ID_movimiento)).size);
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    await db.close();
    const summary={scope:'HTTP, JWT, PostgreSQL aislado; tablas, CHECK, enums, índices y triggers extraídos de SQL/supabase.sql, con una coma corregida solo en la copia de prueba. Correos y efectos auxiliares de movimientos simulados. Sin acceso a producción.',passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,total:results.length,results,logs};
    fs.writeFileSync(path.join(__dirname,'auditoria-2026-10-14-resultados.json'),JSON.stringify(summary,null,2));
    console.log(JSON.stringify({...summary,results:summary.results.filter(x=>!x.passed),logs:undefined},null,2));
  }
})().catch(error=>{originalError(error);process.exitCode=1;});
