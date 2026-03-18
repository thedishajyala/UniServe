const Message = require('../models/Message');

function setupChatSockets(io) {
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        // Each user joins their own personal room for direct notifications
        socket.on('join_user_room', ({ userId }) => {
            socket.join(`user_${userId}`);
            socket.userId = userId;
            console.log(`User ${userId} joined personal room`);
        });

        // Join the chat room for a specific order
        socket.on('join_order_room', ({ orderId, userId }) => {
            socket.join(`order_${orderId}`);
            socket.orderId = orderId;
            socket.userId = userId;
            console.log(`User ${userId} joined room order_${orderId}`);
        });

        // Handle new message (text or image sent via socket after HTTP upload)
        socket.on('send_message', async ({ orderId, senderId, content, type, image_url }) => {
            try {
                // For text messages, save to DB via socket. Images are saved by the HTTP upload route.
                let savedMessage;
                if (type === 'image' && image_url) {
                    // Already saved via HTTP upload — just broadcast
                    savedMessage = { orderId, sender_id: senderId, type: 'image', image_url, content: '', createdAt: new Date() };
                } else {
                    const message = await Message.create({
                        order_id: orderId,
                        sender_id: senderId,
                        type: 'text',
                        content,
                    });
                    savedMessage = { _id: message._id, order_id: orderId, sender_id: senderId, type: 'text', content, createdAt: message.createdAt };
                }

                io.to(`order_${orderId}`).emit('receive_message', savedMessage);
            } catch (err) {
                console.error('Message send error:', err);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing', ({ orderId, userId, isTyping }) => {
            socket.to(`order_${orderId}`).emit('partner_typing', { userId, isTyping });
        });

        // Status update broadcast
        socket.on('status_update', ({ orderId, status, userId }) => {
            io.to(`order_${orderId}`).emit('order_status_changed', { status, updatedBy: userId });
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
}

module.exports = { setupChatSockets };
