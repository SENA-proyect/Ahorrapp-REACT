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