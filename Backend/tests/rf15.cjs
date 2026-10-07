// Ejecuta el código real con una BD simulada; no conecta ni cambia datos reales.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const results = [];
let cats, queries;
function reset() {
  cats = [
    {id_categoria:1,id_usuario:null,nombre:'Sistema global',activa:true,sistema:true,es_global:true},
    {id_categoria:2,id_usuario:7,nombre:'Personal',activa:true,sistema:false,es_global:false},
    {id_categoria:3,id_usuario:8,nombre:'Ajena',activa:true,sistema:false,es_global:false},
    {id_categoria:4,id_usuario:7,nombre:'Sistema propio',activa:false,sistema:true,es_global:false},
  ]; queries=[];
}
async function query(sql, args=[]) {
  const q=sql.replace(/\s+/g,' ').trim(); queries.push({sql:q,args});
  if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(q) || q.startsWith('LOCK TABLE')) return {rows:[]};
  if (q.includes('LOWER(BTRIM(nombre))')) {
    return {rows:cats.filter(c=>(c.es_global || c.id_usuario==args[0]) &&
      c.nombre.trim().toLowerCase()===args[1].trim().toLowerCase() &&
      (args[2]===undefined || c.id_categoria!=args[2])).map(c=>({...c}))};
  }
  if (/^SELECT .* FROM categorias WHERE id_categoria = \$1/.test(q)) {
    return {rows:cats.filter(c=>c.id_categoria==args[0] &&
      (q.includes('(es_global = TRUE OR id_usuario = $2)') ? c.es_global || c.id_usuario==args[1] : c.id_usuario==args[1] && !c.es_global) &&
      (!q.includes('sistema = FALSE') || !c.sistema)).map(c=>({...c}))};
  }
  if (q.startsWith('INSERT INTO categorias')) {
    const c={id_categoria:100+cats.length,id_usuario:args[0],nombre:args[1],descripcion:args[2],activa:true,sistema:false,es_global:false};cats.push(c);return {rows:[c]};
  }
  if(q.startsWith('UPDATE categorias')) {
    const c=cats.find(c=>c.id_categoria==(q.includes('SET nombre') ? args[2] : args[0]) &&
      (!q.includes('sistema = FALSE') || !c.sistema && !c.es_global && c.id_usuario==args[1]));
    if (!c) return {rows:[],rowCount:0};
    if(q.includes('SET nombre')) {c.nombre=args[0];c.descripcion=args[1];}
    else c.activa=q.includes('TRUE');
    return {rows:[],rowCount:1};
  }
  if(q.startsWith('DELETE FROM categorias')) {
    const before=cats.length;
    cats=cats.filter(c=>!(c.id_categoria==args[0] && c.id_usuario==args[1] && !c.sistema && !c.es_global && !c.activa));
    return {rows:[],rowCount:before-cats.length};
  }
  if(q.startsWith('INSERT INTO')) return {rows:[{id_movimiento:900,id_entrada:901,id_salida:902,id_ingresos:903,id_gastos:904,id_ahorros:905,id_imprevistos:906,id_deudas:907}]};
  throw Error('Consulta no soportada por el doble: '+q);
}
const pool={query,connect:async()=>({query,release(){}})};
function load(file) {
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'Backend/src/controllers',file),'utf8'),{
    module,exports:module.exports,console,
    require(name){
      if(name==='../db/connection')return pool;
      if(name.includes('PresupuestosController'))return {actualizarIngresoReal:async()=>{}};
      if(name.includes('NotificacionesService'))return {verificarUmbralGastos:async()=>{},verificarUmbralImprevistos:async()=>{},verificarMetaAhorroAlcanzada:async()=>{}};
      throw Error('Dependencia no prevista: '+name);
    }
  },{filename:file});return module.exports;
}
const categories=load('categoriasController.js'), movements=load('movimientosController.js');
async function call(fn,body={},id=2) {
  const res={statusCode:200,status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}};
  await fn({usuario:{id:7},params:{id},body},res);return res;
}
async function check(name,fn) {
  reset();try {const {expected,actual}=await fn();results.push({name,expected,actual,passed:expected===actual});}catch(e){results.push({name,error:e.message,passed:false});}
}
(async()=>{
  await check('Crear personalizada',async()=>({expected:201,actual:(await call(categories.crearCategoria,{nombre:'Nueva'})).statusCode}));
  await check('Rechazar nombre vacío',async()=>({expected:400,actual:(await call(categories.crearCategoria,{nombre:'   '})).statusCode}));
  await check('Editar personalizada',async()=>({expected:200,actual:(await call(categories.actualizarCategoria,{nombre:'Cambio'})).statusCode}));
  await check('Deshabilitar personalizada',async()=>{await call(categories.deshabilitarCategoria);return {expected:false,actual:cats.find(c=>c.id_categoria===2).activa};});
  await check('Habilitar personalizada',async()=>{cats[1].activa=false;await call(categories.habilitarCategoria);return {expected:true,actual:cats[1].activa};});
  await check('Eliminar activa rechazado',async()=>({expected:409,actual:(await call(categories.eliminarCategoria)).statusCode}));
  await check('Eliminar deshabilitada',async()=>{cats[1].activa=false;return {expected:200,actual:(await call(categories.eliminarCategoria)).statusCode};});
  for(const [operation,fn] of [['editar',categories.actualizarCategoria],['deshabilitar',categories.deshabilitarCategoria],['habilitar',categories.habilitarCategoria],['eliminar',categories.eliminarCategoria]]) {
    await check('Proteger global: '+operation,async()=>({expected:403,actual:(await call(fn,{nombre:'Cambio'},1)).statusCode}));
    await check('Proteger ajena: '+operation,async()=>({expected:403,actual:(await call(fn,{nombre:'Cambio'},3)).statusCode}));
    await check('Proteger sistema no global: '+operation,async()=>({expected:403,actual:(await call(fn,{nombre:'Cambio'},4)).statusCode}));
  }
  await check('Bloquear creación duplicada',async()=>({expected:409,actual:(await call(categories.crearCategoria,{nombre:' personal '})).statusCode}));
  await check('Bloquear edición duplicada',async()=>({expected:409,actual:(await call(categories.actualizarCategoria,{nombre:'Sistema global'})).statusCode}));
  await check('Permitir mismo nombre en usuarios diferentes',async()=>({expected:201,actual:(await call(categories.crearCategoria,{nombre:'Ajena'})).statusCode}));
  await check('Permitir editar conservando el nombre',async()=>({expected:200,actual:(await call(categories.actualizarCategoria,{nombre:' Personal '})).statusCode}));
  await check('Bloquear duplicado deshabilitado',async()=>{cats[1].activa=false;return {expected:409,actual:(await call(categories.crearCategoria,{nombre:' PERSONAL '})).statusCode};});
  for (const body of [{nombre:123},{nombre:'x'},{nombre:'x'.repeat(51)},{nombre:'Valido',descripcion:42},{nombre:'Valido',descripcion:'x'.repeat(201)}]) {
    for (const [name,fn] of [['crear',categories.crearCategoria],['editar',categories.actualizarCategoria]]) {
      await check('Validar datos en '+name+': '+JSON.stringify(body),async()=>({expected:400,actual:(await call(fn,body)).statusCode}));
    }
  }
  for(const [flow,type] of [['Entrada','Ingreso'],['Entrada','Ahorro'],['Salida','Gasto'],['Salida','Imprevisto'],['Salida','Deuda']]) {
    await check('Bloquear categoría deshabilitada en '+type,async()=>{cats[1].activa=false;const r=await call(movements.crearMovimiento,{tipo_flujo:flow,subtipo_modulo:type,datos:{monto:1000,id_categoria:2,fuente:'Auditoria'}});return {expected:true,actual:r.statusCode>=400&&r.statusCode<500&&!queries.some(q=>q.sql.startsWith('INSERT INTO'))};});
  }
  for (const id of [1,2,null,undefined,'']) {
    await check('Permitir movimiento con categoría disponible/opcional: '+id,async()=>({expected:201,actual:(await call(movements.crearMovimiento,{tipo_flujo:'Salida',subtipo_modulo:'Gasto',datos:{monto:1000,id_categoria:id}})).statusCode}));
  }
  for (const id of [3,999,0,-1,'abc','1.5']) {
    await check('Rechazar categoría ajena/inexistente/inválida: '+id,async()=>{const r=await call(movements.crearMovimiento,{tipo_flujo:'Salida',subtipo_modulo:'Gasto',datos:{monto:1000,id_categoria:id}});return {expected:true,actual:r.statusCode===400&&!queries.some(q=>q.sql.startsWith('INSERT INTO'))};});
  }
  const output={scope:'Controladores reales, PostgreSQL y servicios secundarios simulados. No prueba HTTP ni persistencia real.',passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results};
  console.log(JSON.stringify(output,null,2));process.exitCode=output.failed?1:0;
})();
