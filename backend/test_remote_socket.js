const io = require('socket.io-client');
const RENDER_URL = 'http://localhost:5001';
const socket = io(RENDER_URL);

socket.on('connect', () => {
    // We must join the order room to receive the broadcast back
    socket.emit('join_order_room', { orderId: '609b1f0c2a5c4e1f8a846200', userId: '609b1f0c2a5c4e1f8a846201' });

    console.log('Socket Connected to Render! Sent Join Room.', socket.id);
    
    // We will just emit a garbage request and see if it returns message_error
    socket.emit('send_message', { 
        orderId: '609b1f0c2a5c4e1f8a846200', 
        senderId: '609b1f0c2a5c4e1f8a846201', 
        content: 'ping ' + Date.now(), 
        type: 'text' 
    });
});

socket.on('message_error', (err) => {
    console.log('Backend threw error in Message.create:', err);
    process.exit(1);
});

socket.on('receive_message', (msg) => {
    console.log('Backend Successfully processed Message.create:', msg);
    process.exit(0);
});

setTimeout(() => { console.log('Timeout. No response'); process.exit(1); }, 10000);
