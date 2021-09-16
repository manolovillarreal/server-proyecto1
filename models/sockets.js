const { comprobarJWT } = require('../helpers/generar-jwt');

const matchmaking = require('./matchmaking');
const Usuario = require('../models/usuario');
const { usuarioConectado } = require('../controllers/sockets');

class Sockets{
    constructor(io){
        this.io = io;
        this.onlineUsers = [];
        this.socketsEvents();
        this.socketMiddlewares();
        this.lookForMatchReady();
    }
    socketMiddlewares(){
        //Validar token
        this.io.use((socket,next)=> {
            let {token} = socket.handshake.query;
            let uid = comprobarJWT(token);
            if(uid){
                socket.uid = uid;
                return next();
            }
            //Emitir desconexion por falta de autorizacion
            console.log("reject token");
            return next(new Error("authentication error"));
        });
    }
    socketsEvents(){
        this.io.on('connection', async (socket) => {
            console.log('a user connected ' + socket.uid);

            let {password, _id:uid , ...user} = await Usuario.findById(socket.uid);
            user = {id:socket.id,uid, ...user };

            this.onlineUsers.push(user);
            usuarioConectado(user.uid);

            //Saber que amigos estan enlinea y enviarlos al cliente
            const onlineFriends = user.friends.filter(f => f.online);
            //Emitir mensaje de bienvenida    
            socket.emit('onConnection', { msg: 'Bienvenido al servidor WebSocket' });
            
            //Notificar conexion a los amigos
            for (const friend of user.friends) {
                let connected = this.onlineUsers.find(u => u.username == friend.username);
                if(connected){
                    this.io.sockets.connected[connected.id].emit('user-connected',{username:user.username}) ;
                    console.log(connected.id);
                }
            }    
      
                
            //Evento Find Match
            socket.on('findMatch',()=>{
                let user = this.onlineUsers.find(u => u.id == socket.id);
                console.log(`${user.username} esta buscando partida`);
                matchmaking.addPlayer(user);
            });
            //Evento para solicitud de amistad
            socket.on('requestFriendship',(username)=>{
                let connected = this.onlineUsers.find(u => u.username == username);
                if(connected){
                    //Emit friendRequest
                    console.log(connected.id);        
                }
            });
            //Evento cuando se desconecta un cliente
            socket.on('disconnect', () => {
                /*
                AQUI DEBERIA VERIFICAR SI EL USUARIO DESCONECTADO
                ESTA BUSCANDO PARTIDA 
                */
                console.log('user disconnected');
                usuarioConectado(user.uid,false);         
            });
        });
        
    }
    
    startMatchReady(match){
        let room = match.id;
        for (const player of match.players) {
             player.room = room;
             console.log(player.id);
             this.io.sockets.connected[player.id].join(room);        
        } 
        this.io.to(room).emit('matchReady',{
            msg:"Match Ready",
            match: match.id
        });
     }

    lookForMatchReady(){
        setInterval(()=>{
            if(matchmaking.startingMatches.length>0){
                
                let matchReady = matchmaking.startingMatches.shift();
                console.log("Starting Match: "+matchReady.id);
                this.startMatchReady(matchReady);
            }
        },1000);
    }
}

module.exports = Sockets;