const Message = require('../models/Message');

function setupChatSockets(io) {
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        // Join the chat room for a specific order
        socket.on('join_order_room', ({ orderId, userId }) => {
            socket.join(`order_${orderId}`);
            socket.orderId = orderId;
            socket.userId = userId;
            console.log(`User ${userId} joined room order_${orderId}`);
        });

        // Handle new message
        socket.on('send_message', async ({ orderId, senderId, content }) => {
            try {
                const message = await Message.create({
                    order_id: orderId,
                    sender_id: senderId,
                    content,
                });

                // Broadcast to all in the room (including sender)
                io.to(`order_${orderId}`).emit('receive_message', {
                    _id: message._id,
                    order_id: orderId,
                    sender_id: senderId,
                    content,
                    createdAt: message.createdAt,
                });
            } catch (err) {
                console.error('Message send error:', err);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing', ({ orderId, userId, isTyping }) => {
            socket.to(`order_${orderId}`).emit('partner_typing', { userId, isTyping });
        });

        // Status update from delivery partner
        socket.on('status_update', ({ orderId, status, userId }) => {
            io.to(`order_${orderId}`).emit('order_status_changed', { status, updatedBy: userId });
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
}

module.exports = { setupChatSockets };
