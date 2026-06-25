revisar la version:
openssl version

crear carpeta "certs" y ubicarnos en ella, despues de eso ejecutar el comando:
openssl genrsa -out localhost.key 2048

Despues generamos el certificado autofirmado:
openssl req -x509 -new -nodes -key localhost.key -sha256 -days 365 -out localhost.crt -subj "/C=CO/ST=Bogota/L=Bogota/O=AhorrApp/CN=localhost"

validamos el certificado:
openssl x509 -in localhost.crt -text -noout

Cambiar el nombre de los certificados de las llaves SSL por:
localhost.key -> private.key
localhost.crt -> certificate.crt
Tanto en el backend como en el frontend y en el archivo vie.config