
# Proyecto 1 - Sistemas interactivos distribuidos
 Servidor Node de Autenticacion y WebSockes

#### Actividades del Backend
1. Crear la logica necesaria para agregar amigos, tanto de interaccion websockets como de registro en la "base de datos"
2. Cuando un cliente se conecte debe recibir la lista de amigos y cuales se enceuntran en linea
3. Crear la logica necesaria para habilitar el chat global y chat privado entre amigos
4. Crear la logica necesaria para permitir los retos directos entre amigos
5. Crear la opcion para que un cliente pueda cancelar la busqueda de una partida



#### Considerar los siguientes escenarios
* Si un cliente esta buscando partida y se desconecta, el proceso de mathmaking debe ajustarse
* Si un cliente esta en una partida y se desconecta, deberia poder ingresar nuevamente al mismo room 
* Si un cliente se desconecta se debe notificar a sus amigos conectados que el usuario se desconecto
* Un mismo usuario no deberia poder abrir mas de una conexion websocket
* Cuando una conexion websocket es rechazada por validacion de token, debe emitirse un mensaje al cliente antes de cerrar la conexion

Pueden surgir mas necesidades durante el desarrollo
