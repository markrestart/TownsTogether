//Web Server
const express = require('express');
const app = express();
const port = 3000;
app.use(express.static('client'));
app.get('/', (req, res) => {
    res.redirect(`/index.html`);
})

//Socket server
const server = require('http').Server(app);
const io = require('socket.io')(server);

var activePlayers = [];

io.on('connection', socket => {
    // When someone attempts to join the room
    socket.on('join-room', (position, rotation) => {
        //socket.join(roomId);  // Join the room
        socket.broadcast.emit('user-connected', socket.id, position, rotation); // Tell everyone else in the room that we joined
        console.log(socket.id + " Joined");
        activePlayers.forEach(element => {
            socket.emit('user-connected', element.id, element.pos, element.rot, element.name); //Tell the newly connected user about the existing active players
        });
        activePlayers.push({id:socket.id, pos:position, rot:rotation, name:""});   //Add the newly conntected user to the array of active players
        
        // Communicate the disconnection
        socket.on('disconnect', () => {
            socket.broadcast.emit('user-disconnected', socket.id);  //Let everyone else know that a player has disconnected
            console.log(socket.id + " Left");
            activePlayers = activePlayers.filter(p => p.id != socket.id);   //Filter the disconnected user from the active players array
        });
    });

    socket.on('move', (pos, rot) =>{
        activePlayers.find(p => p.id == socket.id).pos = pos;
        activePlayers.find(p => p.id == socket.id).rot = rot;
        socket.broadcast.emit('move', socket.id, pos, rot); //Communicate that a player has moved
    });

    socket.on('set-name', (newName) =>{
        activePlayers.find(p => p.id == socket.id).name = newName;
        socket.broadcast.emit('set-name', socket.id, newName); //Communicate that a player has a new name
    });
});

server.listen(process.env.PORT || port);