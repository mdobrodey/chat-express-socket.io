import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

let users = new Map();
let connectedUsers = new Set();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('login', (nickname) => {
    if (!nickname || nickname.trim() === '') {
      socket.emit('login', { status: 'FAILED', message: 'Nickname cannot be empty' });
      return;
    }

    if (users.has(nickname.trim())) {
      socket.emit('login', { status: 'FAILED', message: 'Nickname already taken' });
      return;
    }

    users.set(nickname.trim(), socket.id);
    connectedUsers.add(socket.id);
    socket.nickname = nickname.trim();

    socket.emit('login', { status: 'OK', nickname: nickname.trim() });

    io.emit('users_update', Array.from(users.keys()));

    socket.broadcast.emit('user_joined', { nickname: nickname.trim() });
  });

  socket.on('message', (messageText) => {
    if (!socket.nickname) {
      socket.emit('error', { message: 'You must login first' });
      return;
    }

    if (!messageText || messageText.trim() === '') {
      return;
    }

    const messageData = {
      nickname: socket.nickname,
      message: messageText.trim(),
      timestamp: new Date().toISOString(),
      id: uuid()
    };

    io.emit('new_message', messageData);
  });

  socket.on('disconnect', () => {
    users.delete(socket.nickname);
    connectedUsers.delete(socket.id);
    console.log(`User disconnected: ${socket.id}`);

    io.emit('users_update', Array.from(users.keys()));

    socket.broadcast.emit('user_leave', { nickname: socket.nickname });
  })
});

server.listen(5000, () => {
  console.log(`server started`);
});