En caso de tener errores con el xampp
1- apagar el xamp totalmente
2- buscar en documentos (disco local c) xampp->mysql
3- cambiar el nombre de la carpeta data por "data_V"
4- crear una nueva carpeta "data"
5- Copiar TODO el contenido de la carpeta "backup" y ponerla en "data"
6- De la carpeta "data-V" traer el archivo "ibdata1" y la carpeta de la DB que creamos (en este caso la de "seproyectona") y copiarla en "data"
7- volver a ejecutar mysql
8- en la carpeta raiz de mysql (Servidor:127.0.0.1) y en el editor de phpmyadmin, dirigirse a la tabla de sql y poner el siguiente script "REPAIR TABLE mysql.db;"