const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let users = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 클라이언트로부터 위치 및 메시지 데이터 수신
  socket.on('update_data', (data) => {
    users[socket.id] = { ...data, socketId: socket.id };
    // 모든 클라이언트에게 현재 접속 중인 유저들의 상태 브로드캐스트
    io.emit('users_update', Object.values(users));
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete users[socket.id];
    io.emit('users_update', Object.values(users));
  });
});

const PORT = 3000;
// 0.0.0.0으로 열어두어 같은 Wi-Fi 내의 스마트폰들이 접속할 수 있게 합니다.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[달칵 데모 서버] 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`스마트폰이 같은 Wi-Fi에 연결되어 있어야 합니다.`);
});
