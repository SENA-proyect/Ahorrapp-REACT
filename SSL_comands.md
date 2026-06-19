revisar la version:
openssl version

crear carpeta "certs" y ubicarnos en ella, despues de eso ejecutar el comando:
openssl genrsa -out localhost.key 2048

Despues generamos el certificado autofirmado:
openssl req -x509 -new -nodes -key localhost.key -sha256 -days 365 -out localhost.crt -subj "/C=CO/ST=Bogota/L=Bogota/O=AhorrApp/CN=localhost"

validamos el certificado:
openssl x509 -in localhost.crt -text -noout

