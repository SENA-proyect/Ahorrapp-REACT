const fs=require('node:fs'); const path=require('node:path'); const Module=require('node:module');
const frontend=path.resolve(__dirname,'../Frontend'); const req=Module.createRequire(path.join(frontend,'package.json'));
const {JSDOM,VirtualConsole}=req('jsdom'); const {build}=req('esbuild'); const React=req('react'); const {act}=React; const {createRoot}=req('react-dom/client');
const results=[]; const warnings=[]; const errors=[]; const originalError=console.error;
console.error=(...x)=>errors.push(x.map(y=>y?.message||String(y)).join(' ')); console.warn=(...x)=>warnings.push(x.map(String).join(' '));
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let dom;
function environment(route,role){
 const vc=new VirtualConsole(); vc.on('jsdomError',e=>errors.push(e.message));
 dom=new JSDOM('<div id="root"></div>',{url:'https://localhost'+route,virtualConsole:vc});
 for(const key of ['window','document','localStorage','sessionStorage','HTMLElement','Element','Node','getComputedStyle']) globalThis[key]=dom.window[key];
 globalThis.ResizeObserver=class{observe(){} unobserve(){} disconnect(){}};
 if(role){localStorage.setItem('token','test-token');for(const key of ['user','usuario'])localStorage.setItem(key,JSON.stringify({id:7,nombre:'Prueba',roles:[role]}));}
}
const responseData=url=>{
 const p=new URL(url,'https://localhost').pathname;
 if(p.endsWith('/no-leidas/count')) return {count:0};
 if(p.endsWith('/notificaciones')) return {notificaciones:[],total:0,page:1,totalPages:0};
 if(p.includes('/categorias'))return {ok:true,categorias:[]};
 if(p.endsWith('/historial/propio')||p.endsWith('/historial'))return {ok:true,historial:[]};
 if(p.endsWith('/PanelUsuarios'))return {ok:true,usuarios:[]};
 if(p.endsWith('/PanelDependientes'))return {ok:true,dependientes:[]};
 if(p.endsWith('/usuarios/PanelAdmin'))return {totalUsuarios:0};
 if(p.endsWith('/dependientes/PanelAdmin'))return {totalDependientes:0};
 if(p.includes('/presupuestos'))return {ok:true,data:p.endsWith('/activo')?null:[],total:0,totalPaginas:0};
 if(p.endsWith('/dashboard/resumen'))return {totalIngresos:0,totalGastos:0,totalAhorros:0,balance:0,sin_periodo:true};
 if(p.includes('/dashboard'))return {data:[]};
 if(p.endsWith('/fondo-emergencia/movimientos'))return {ok:true,datos:[]};
 if(p.includes('/fondo-emergencia'))return {ok:true,datos:{id_fondo:1,meta:1000,saldo_actual:0},data:[]};
 if(p.includes('/preferencias'))return {ok:true,preferencias:[]};
 return [];
};
(async()=>{
 environment('/',null);
 const bundle=await build({stdin:{contents:"export {default as App} from './src/App.jsx'; export * as api from './src/services/api.js';",resolveDir:frontend,loader:'jsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','react-dom','react-dom/client','react-router-dom'],loader:{'.css':'empty','.png':'dataurl','.jpg':'dataurl','.svg':'dataurl'}});
 const compiled=new Module(path.join(frontend,'audit-bundle.cjs'));compiled.paths=Module._nodeModulePaths(frontend);compiled._compile(bundle.outputFiles[0].text,compiled.id);
 const {App,api}=compiled.exports;dom.window.close();
 const publicRoutes=['/','/Login','/OlvidarContrasena','/VerificacionCorreo','/ConfirmacionCambioContrasena','/IngresoNuevaContrasena','/Unauthorized'];
 const privateRoutes=['/Dashboard','/IndexLogeado','/ModuloAhorros','/ModuloDeudas','/ModuloImprevistos','/ModuloFondoEmergencia','/ModulosCategorias','/ModulosDependientes','/ModulosGastos','/ModulosIngresos','/Reportes','/noticias','/ModulosPresupuestos','/Configuracion','/movimientos/nuevo','/PanelAdmin','/PanelDependientes','/PanelHistorial','/PanelMovimientos','/PanelUsuarios'];
 for(const mode of ['sin sesión','user','admin','error de red'])for(const route of [...publicRoutes,...privateRoutes]){
  environment(route,mode==='sin sesión'?null:mode==='admin'?'admin':'user');const start=errors.length;let caught;
  globalThis.fetch=async url=>{if(mode==='error de red')throw Error('Red simulada no disponible');return new Response(JSON.stringify(responseData(String(url))),{status:200,headers:{'Content-Type':'application/json'}});};
  const root=createRoot(document.getElementById('root'),{onUncaughtError:e=>{caught=e.message;}});
  try{await act(async()=>{root.render(React.createElement(App));});await act(async()=>{await new Promise(r=>setTimeout(r,10));});
   const redirected=!(mode==='sin sesión'&&privateRoutes.includes(route))||window.location.pathname==='/Login';
   results.push({name:`${mode}: ${route}`,passed:!caught&&document.body.textContent.trim().length>0&&redirected,error:caught||(!redirected?'No redirige a Login':undefined),logs:errors.slice(start)});
  }catch(e){results.push({name:`${mode}: ${route}`,passed:false,error:e.message});}
  finally{await act(async()=>root.unmount());dom.window.close();}
 }
 environment('/', 'user');
 for(const code of [401,403,500]){
  globalThis.fetch=async()=>new Response(JSON.stringify({ok:false,mensaje:'Error de prueba'}),{status:code});
  let rejected=false,value;try{value=await api.getMovimientos();}catch{rejected=true;}
  results.push({name:`getMovimientos propaga HTTP ${code}`,passed:rejected,actual:value});
 }
 globalThis.fetch=async()=>{throw Error('Sin red');};let rejected=false,value;try{value=await api.getMovimientos();}catch{rejected=true;}
 results.push({name:'getMovimientos propaga fallo de red',passed:rejected,actual:value});dom.window.close();
 const summary={scope:'React real en JSDOM, cuatro modos por ruta, respuestas HTTP simuladas; no prueba visual de navegador ni backend desplegado.',total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,results,warnings:[...new Set(warnings)]};
 fs.writeFileSync(path.join(__dirname,'auditoria-rf-all-2026-10-26-frontend.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,results:results.filter(x=>!x.passed)},null,2));
})().catch(e=>{originalError(e);process.exitCode=1;});
