const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const jwt = require('jsonwebtoken');
const { fixture } = require('./rf19-fixture.cjs');
const results = [];
async function check(rf, name, expected, action, kind = 'funcional') {
  try {
    const actual = await action();
    results.push({ rf, name, kind, expected, actual, passed: JSON.stringify(actual) === JSON.stringify(expected) });
  } catch (error) {
    results.push({ rf, name, kind, expected, error: error.message, passed: false });
  }
}
(async () => {
  const db = await fixture();
  let server;
  try {
    const sql = fs.readFileSync(path.resolve(__dirname, '../../SQL/supabase.sql'), 'utf8');
    const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS[\s\S]*?\n\);/g)].map(m => m[0]);
    await db.pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    for (const m of sql.matchAll(/CREATE TYPE \w+ AS ENUM\s*\([\s\S]*?\);/g)) await db.pool.query(m[0]);
    // Solo la copia aislada: el error del SQL original ya está documentado.
    for (let i = 0; i < tables.length; i++) await db.pool.query(i ? tables[i] : tables[i].replace('fecha_eliminacion_programada TIMESTAMP NULL', 'fecha_eliminacion_programada TIMESTAMP NULL,'));
    for (const m of sql.matchAll(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$\s*(?:LANGUAGE\s+\w+\s*)?;/g)) await db.pool.query(m[0]);
    for (const m of sql.matchAll(/CREATE TRIGGER[\s\S]*?;/g)) await db.pool.query(m[0]);
    for (const m of sql.matchAll(/^CREATE(?: UNIQUE)? INDEX[\s\S]*?;/gm)) await db.pool.query(m[0]);
    await db.pool.query(`INSERT INTO usuarios(id_usuario,nombre,apellido,email,password_hash) VALUES
      (7,'Cuenta','Siete','verde7@test.invalid','no-login'),(8,'Cuenta','Ocho','verde8@test.invalid','no-login'),(9,'Admin','Nueve','verde9@test.invalid','no-login');
      INSERT INTO rol(id_rol,cargo) VALUES(1,'user'),(2,'admin');
      INSERT INTO usuarios_roles VALUES(7,1),(8,1),(9,2);
      INSERT INTO categorias(id_usuario,nombre,activa,sistema,es_global) VALUES
      (NULL,'Global',true,true,true),(7,'Personal',true,false,false),(8,'Ajena',true,false,false),(7,'Inactiva',false,false,false),(7,'Sistema local',true,true,false);`);
    const app = express(); app.use(express.json());
    for (const [prefix, file] of [['dependientes','dependientesRoutes'],['categorias','categoriasRoutes'],['movimientos','movimientosRoutes'],['reportes','ReportesRoutes']]) app.use('/api/' + prefix, require('../src/routes/' + file));
    let aiPayload;
    const axiosId=require.resolve('axios');
    require.cache[axiosId]={id:axiosId,filename:axiosId,loaded:true,exports:{post:async(url,payload)=>{aiPayload=payload;return {data:{choices:[{message:{content:'Respuesta simulada de prueba'}}]}};}}};
    app.use('/api/ai',require('../src/routes/aiRoutes'));
    server = await new Promise(resolve => { const s = app.listen(0,'127.0.0.1',()=>resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const token = (owner, roles = ['user']) => jwt.sign({id:owner,roles},process.env.JWT_SECRET,{expiresIn:'1h'});
    async function request(route, body, method = body === undefined ? 'GET' : 'POST', owner = 7, roles = ['user']) {
      const response = await fetch(base + route, { method, headers: {'Content-Type':'application/json',...(owner ? {Authorization:'Bearer '+token(owner,roles)} : {})}, ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal:AbortSignal.timeout(15000) });
      return {status:response.status,body:await response.json()};
    }
    const status = (...args) => request(...args).then(r=>r.status);
    const dependent = {Nombre:'Ana',Relacion:'Hija',Ocupacion:'Estudiante',Fecha_nacimiento:'2010-01-01',Peso_economico:3};
    let id;
    await check('10','Crear dependiente con todos los campos',201,async()=>{const r=await request('/dependientes',dependent);id=r.body.id_dependientes;return r.status;});
    await check('10','Persisten los cinco campos',[dependent.Nombre,dependent.Relacion,dependent.Ocupacion,'2010-01-01',3],async()=>{const row=(await request('/dependientes')).body.find(x=>x.id_dependientes===id);return [row.Nombre,row.Relacion,row.Ocupacion,row.Fecha_nacimiento.slice(0,10),row.Peso_economico];});
    await check('10','Otra cuenta no lista el dependiente',false,async()=>(await request('/dependientes',undefined,'GET',8)).body.some(x=>x.id_dependientes===id));
    await check('10','Otra cuenta no modifica el dependiente',404,()=>status(`/dependientes/${id}`,{...dependent,Nombre:'Ajeno'},'PUT',8));
    await check('10','Otra cuenta no elimina el dependiente',404,()=>status(`/dependientes/${id}`,undefined,'DELETE',8));
    await check('10','Usuario normal no usa eliminación administrativa',403,()=>status(`/dependientes/admin/${id}`,undefined,'DELETE',7));
    await check('10','Actualizar dependiente propio',200,()=>status(`/dependientes/${id}`,{...dependent,Nombre:'Ana Editada',Peso_economico:5},'PUT'));
    for (const body of [{...dependent,Nombre:''},{...dependent,Relacion:''}]) await check('10',`Rechazo explícito de campo vacío ${JSON.stringify(body)}`,400,()=>status('/dependientes',body));
    for (const body of [{...dependent,Nombre:'   '},{...dependent,Relacion:'   '}]) await check('10',`Nombre y relación no pueden ser solo espacios ${JSON.stringify(body)}`,400,()=>status('/dependientes',body));
    for (const value of [1,5]) await check('10',`Peso límite permitido ${value}`,201,()=>status('/dependientes',{...dependent,Peso_economico:value}));
    for (const value of [0,-1,6,1.5,'abc',null]) await check('10',`Peso inválido ${JSON.stringify(value)} da error de validación`,400,()=>status('/dependientes',{...dependent,Peso_economico:value}),'manejo de errores');
    const noWeight={...dependent};delete noWeight.Peso_economico;
    await check('10','Omitir peso tiene respuesta controlada, sin error interno',true,async()=>[201,400,422].includes(await status('/dependientes',noWeight)),'manejo de errores');
    await check('10','No se persiste ningún peso fuera de 1 a 5',0,async()=>Number((await db.pool.query('SELECT COUNT(*) FROM dependientes WHERE peso_economico NOT BETWEEN 1 AND 5 OR peso_economico IS NULL')).rows[0].count));
    const movement = (type, fields={}) => ({tipo_flujo:['Ingreso','Ahorro'].includes(type)?'Entrada':'Salida',subtipo_modulo:type,datos:{monto:1000,descripcion:'Verde',fuente:'Banco',meta:'Meta',cuotas_total:10,fecha_inicio:'2026-10-01',fecha_fin:'2026-12-01',fecha_registro:'2026-10-15',id_categoria:2,...fields}});
    let gasto;
    await check('10','Crear gasto con dependiente propio',201,async()=>{const r=await request('/movimientos',movement('Gasto',{id_dependientes:id}));gasto=r.body.ID_detalle;return r.status;});
    await check('10','Reporte agrupa el gasto de 1000 por dependiente',true,async()=>{const r=await request('/reportes/gastos/dependientes?fecha_inicio=2026-10-01&fecha_fin=2026-10-31');return r.status===200&&JSON.stringify(r.body).includes('Ana Editada')&&JSON.stringify(r.body).includes('1000');});
    const foreign=await request('/dependientes',{...dependent,Nombre:'Otra cuenta'},'POST',8);
    await check('10','Crear gasto rechaza dependiente de otra cuenta',400,()=>status('/movimientos',movement('Gasto',{id_dependientes:foreign.body.id_dependientes})));
    await check('10','Editar gasto rechaza dependiente de otra cuenta',400,()=>status(`/movimientos/gastos/${gasto}`,{...movement('Gasto').datos,id_dependientes:foreign.body.id_dependientes},'PUT'));
    await status(`/movimientos/gastos/${gasto}`,{...movement('Gasto').datos,id_dependientes:id},'PUT');
    await check('10','Administrador puede eliminar dependiente ajeno',200,()=>status(`/dependientes/admin/${foreign.body.id_dependientes}`,undefined,'DELETE',9,['admin']));
    await check('10','Antes de eliminar, el gasto conserva la referencia al titular',id,async()=>(await db.pool.query('SELECT id_dependientes FROM gastos WHERE id_gastos=$1',[gasto])).rows[0].id_dependientes);
    await check('10','Titular elimina dependiente propio',200,()=>status(`/dependientes/${id}`,undefined,'DELETE'));
    await check('10','Al eliminar dependiente su gasto se conserva sin referencia',null,async()=>(await db.pool.query('SELECT id_dependientes FROM gastos WHERE id_gastos=$1',[gasto])).rows[0].id_dependientes);
    let category;
    await check('15','Crear categoría personalizada',201,async()=>{const r=await request('/categorias',{nombre:'Verde propia'});category=r.body.id;return r.status;});
    await check('15','Rechazar duplicado normalizado',409,()=>status('/categorias',{nombre:'  VERDE PROPIA  '}));
    await check('15','Editar categoría propia',200,()=>status(`/categorias/${category}`,{nombre:'Verde editada'},'PUT'));
    for (const protectedId of [1,3,5]) {
      for (const [suffix,method,body] of [['','PUT',{nombre:'Intento ajeno'}],['/deshabilitar','PATCH',undefined],['/habilitar','PATCH',undefined],['','DELETE',undefined]]) await check('15',`Proteger categoría ${protectedId} en ${method} ${suffix}`,403,()=>status(`/categorias/${protectedId}${suffix}`,body,method));
    }
    const records=[];
    const plurals={Ingreso:'ingresos',Gasto:'gastos',Ahorro:'ahorros',Imprevisto:'imprevistos',Deuda:'deudas'};
    for (const [type,plural] of Object.entries(plurals)) {
      const r=await request('/movimientos',movement(type,{id_categoria:category}));
      await check('15',`Crear ${type} con categoría propia`,201,async()=>r.status);
      records.push({type,plural,id:r.body.ID_detalle});
      await check('15',`Consulta de categorías por módulo ${plural}`,200,()=>status('/categorias/'+plural));
    }
    await check('15','No eliminar categoría activa',409,()=>status(`/categorias/${category}`,undefined,'DELETE'));
    await check('15','Deshabilitar categoría propia',200,()=>status(`/categorias/${category}/deshabilitar`,undefined,'PATCH'));
    for (const {type} of records) await check('15',`Crear ${type} rechaza categoría deshabilitada`,400,()=>status('/movimientos',movement(type,{id_categoria:category})));
    for (const {type,plural,id} of records) await check('15',`Editar ${type} rechaza categoría deshabilitada`,400,()=>status(`/movimientos/${plural}/${id}`,{...movement(type).datos,id_categoria:category,monto_acumulado:0,cuotas_pagadas:0,estado:'pendiente'},'PUT'));
    await check('15','Deshabilitar conserva los cinco registros',5,async()=>{let count=0;for(const {plural,id} of records)count+=(await db.pool.query(`SELECT COUNT(*)::int AS n FROM ${plural} WHERE id_${plural}=$1 AND id_categoria=$2`,[id,category])).rows[0].n;return count;});
    await check('15','Volver a habilitar',200,()=>status(`/categorias/${category}/habilitar`,undefined,'PATCH'));
    await status(`/categorias/${category}/deshabilitar`,undefined,'PATCH');
    await check('15','Eliminar categoría deshabilitada',200,()=>status(`/categorias/${category}`,undefined,'DELETE'));
    for (const {type,plural,id} of records) await check('15',`Eliminar categoría conserva ${type} y deja categoría nula`,null,async()=>(await db.pool.query(`SELECT id_categoria FROM ${plural} WHERE id_${plural}=$1`,[id])).rows[0].id_categoria);
    for(const prefix of ['dependientes','categorias']) await check(prefix==='dependientes'?'10':'15','Consulta sin token '+prefix,401,()=>status('/'+prefix,undefined,'GET',null));
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    await db.close();
    const groups=Object.fromEntries(['10','15'].map(rf=>{const rows=results.filter(x=>x.rf===rf);return ['RF-'+rf,{total:rows.length,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length}];}));
    const output={scope:'HTTP/JWT y PostgreSQL temporales reales, esquema del proyecto con coma corregida solo en la copia; efectos auxiliares controlados; sin producción.',groups,results};
    fs.writeFileSync(path.join(__dirname,'rf10-rf15-integration-results.json'),JSON.stringify(output,null,2));
    console.log(JSON.stringify({groups,failures:results.filter(x=>!x.passed)},null,2));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
