const { Server } = require('socket.io');

const socketHandler = (server) => {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('New socket connection');

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    });

    return io;

};

module.exports = socketHandler;