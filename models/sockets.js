const { comprobarJWT } = require('../helpers/generar-jwt');

const matchmaking = require('./matchmaking');
const Usuario = require('../models/usuario');

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
            console.log("Validando token");
            let {token} = socket.handshake.query;
            let uid = comprobarJWT(token);
            if(uid){
                socket.uid = uid;
                return next();
            }
            return next(new Error("authentication error"));
        });
    }
    socketsEvents(){
        this.io.on('connection', async (socket) => {
            console.log('a user connected ' + socket.uid);

            let {password, _id:uid , ...user} = await Usuario.findById(socket.uid);
            user = {id:socket.id,uid, ...user };
            console.log(user);

            this.onlineUsers.push(user);
            //Saber que amigos estan enlinea y enviarlos al cliente
            
            //Notificar conexion a los amigos
            for (const friend of user.friends) {
                let connected = this.onlineUsers.find(u => u.username == friend.username);
                if(connected){
                    this.io.sockets.connected[connected.id].emit('user-connected',{username:user.username}) ;
                    console.log(connected.id);
                }
            }        
            socket.emit('onConnection', { msg: 'Bienvenido al servidor WebSocket' });
                
            //Escuchando eventos
            socket.on('createRoom', (roomOptions) => {
                console.log('Create Room:',roomOptions);
                this.io.emit('roomCreated',{roomOptions});
            });
            socket.on('findMatch',()=>{
                let user = this.onlineUsers.find(u => u.id == socket.id);
                console.log(`${user.username} esta buscando partida`);
                matchmaking.addPlayer(user);
            });
            socket.on('requestFriendship',(username)=>{
                let connected = this.onlineUsers.find(u => u.username == username);
                if(connected){
                    //Emit friendRequest
                    console.log(connected.id);        
                }
            });
        
            socket.on('disconnect', () => {
                /*
                AQUI DEBERIA VERIFICAR SI EL USUARIO DESCONECTADO
                ESTA BUSCANDO PARTIDA
                */
                console.log('user disconnected');
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