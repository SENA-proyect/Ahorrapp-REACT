# Migracion de la base de datos alojada en supabase con docker

## Heramientas necesarias

| Heramienta | Descripcion |
| ---------- | ----------  |
| ***Docker Desktop*** | Ejecuta el motor interno que descarga y sube los datos entre las cuentas. |
| ***Node.js*** | Permite instalar la herramienta de comandos de Supabase. |
 ***Supabase CLI*** | Proporciona los comandos para exportar de la Cuenta A e importar a la Cuenta B. |

<br>

Sobra Mencionar que se necesitas sumplir con ciertos requisitos tales como:
- Cuenta en supabase
- Cuenta en Docker
- Base de datos con datos existentes
- Editor de codigo (visual estudio por dar un ejemplo)

> En este caso ya se cuenta con la instalacion de 2 de las 3 herramientas asi que anexare el como instalar Supabase CLI

### Instalacion de supabase CLI

#### 1
Nos ubicaremos en la carpeta del proyecto (en este caso el de la version web), abriremos la terminal y ejecutaremos el siguiente comando 
```body
npm install -g supabase
```
#### 2
Una vez puesto el comando anterior revisaremos si quedo bien ejecutado con el siguiente comando
```body 
supabase --version
```
Si arrojo un numero de version (en mi caso 2.121.0), significa que quedo bien ejecutado y podemos pasar al siguiente punto

<br>

#### 3
Iniciaremos sesion en supabase con el comando
```body
supabase login
```
Esto abrira una ventana en la cual debemos completar el proceso para poder proporcionar el codigo que nos solicita la terminal

Con eso ultimo ya habremos finalizado la instalacion y comprobacion del Supabase CLI

<hr>

### Migracion de la DB
***Es necesario tener Docker Desktop iniciado en segundo plano para la ejecucion de este apartado***
### 1-
Iniciaremos sesion en la cuenta que tiene la DB con los datos, nos iremos a la sesion de "connect", iremos a direct connection string y pondremos la opcion de "session pooler"

De esa manera conseguiremos la url de la DB
> En mi caso es: postgresql://postgres.vcvlcoxbxjkmvdkwnbdo:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres

Continuaremos ejecutando este comando
```body
supabase db dump --db-url "TU_URL_DE_CONEXION_AQUÍ" -f esquema.sql
```
<!-- ```body
supabase db dump --db-url postgresql://postgres.vcvlcoxbxjkmvdkwnbdo:jWlVKeI6Rz3Klvp3@aws-0-us-west-2.pooler.supabase.com:5432/postgres -f esquema.sql
``` -->

Si se crea un nuevo archivo "esquema.sql" quiere decir que vamos bien

#### 2-
Ahora continuaremos con la ejecucion del siguiente comando
```body
supabase db dump --db-url "TU_URL_DE_CONEXION_AQUÍ" --data-only -f datos.sql
```
<!-- ```body
supabase db dump --db-url postgresql://postgres.vcvlcoxbxjkmvdkwnbdo:jWlVKeI6Rz3Klvp3@aws-0-us-west-2.pooler.supabase.com:5432/postgres --data-only -f datos.sql
``` -->
Si se creo una carpeta "datos.sql" quiere decir que vamos bien

#### 3- 
Ahora iniciamos sesion en supabase con la cuenta a la que vamos a realizarle la migracion, debemos crear un proyecto con la nueva cuenta en supabase y lo dejaremos en blanco

Ejecutaremos los pasos previamente mencionados para obtener el URL del proyecto y ejecutaremos este comando
```body
supabase db push --db-url "TU_URL_DE_CONEXION_B"
```

<!-- ```body
supabase db push --db-url postgresql://postgres.rhuxqderwzntwnxzjrpu:6ttWZiYzP4lYncUs@aws-1-us-west-2.pooler.supabase.com:5432/postgres
``` -->
En caso de obtener este mensae ```Remote database is up to date.``` significa que ya se sincronizo con la DB pero no se ha ejecutado el archivo local, por lo que ejecutaremos el siguiente comando: 

```body
docker run --rm -v "${PWD}:/workspace" postgres:15-alpine psql "TU_URL_DE_CONEXION_B" -f /workspace/esquema.sql
```

<!-- docker run --rm -v "${PWD}:/workspace" postgres:15-alpine psql "postgresql://postgres.rhuxqderwzntwnxzjrpu:6ttWZiYzP4lYncUs@aws-1-us-west-2.pooler.supabase.com:5432/postgres" -f /workspace/esquema.sql -->

Si empiezan a salir mensajes tipo "alter default privileges, grant, alter table" quiere decir que el proceso se esta ejecutando de buena manera y se esta subiendo al estructura de la DB a la nueva cuenta, aun no hemos subido datos, es normal que las tablas esten vacias

#### 4-
Ahora vamos a subir los datos, ejecutaremos el siguiente comando
```body
docker run --rm -v "${PWD}:/workspace" postgres:15-alpine psql "TU_URL_DE_CONEXION_B" -f /workspace/datos.sql
```
<!-- docker run --rm -v "${PWD}:/workspace" postgres:15-alpine psql postgresql://postgres.rhuxqderwzntwnxzjrpu:6ttWZiYzP4lYncUs@aws-1-us-west-2.pooler.supabase.com:5432/postgres -f /workspace/datos.sql -->
Y listo, si todo salio bien, los datos se veran reflejados en supabase con la nueva cuenta.

<hr>
Por si las dudas, docker se uso como un contenedor de herramienta portatil, es decir, nos evitamos instalar mas cosas como postgres ya que docker nos ofrecio una imagen (algo asi como una mini compu portatil) con todo ya configurado, en si docker realizo procesos en segundo plano
<hr>

>URL DE MI DB:
<!-- postgresql://postgres.rhuxqderwzntwnxzjrpu:BsPPkCfhSTZfZxut@aws-1-us-west-2.pooler.supabase.com:5432/postgres -->