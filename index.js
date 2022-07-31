const { v4: uuidv4 } = require("uuid");
const path = require("path");
const express = require("express");
const app = express();
app.use(express.static(path.join(__dirname, "build")));
app.use(express.static("public"));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
})
const server = require("http").createServer(app);
server.listen(process.env.PORT || 5000, () => {
  console.log("server running on port: 5000");
})
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

const rooms = {};
wss.on("connection", (ws) => {
  const userId = uuidv4();

  ws.on("message", (message) => {
    const msg = JSON.parse(message);
    const { type, roomId } = msg;

    switch (type) {
      case "createRoom":
        createRoom(userId, ws);
        break;
      case "joinRoom":
        joinRoom(roomId, userId, ws);
        break;
      case "getReady":
        getReady(roomId, userId);
        break;
      case "ballReset":
        resetBall(roomId, msg.scoredPlayer);
        break;
      case "platformMove":
        movePlatform(msg.platformLocation, roomId, userId);
        break;
      case "leave":
        leaveRoom(roomId, userId);
        break;
    }
  });
});

const createRoom = (userId, ws) => {
  console.log("creating room");
  const roomId = uuidv4();
  rooms[roomId] = {};
  rooms[roomId][userId] = { socket: ws, guest: false, ready: false, score: 0 };
  ws.send(JSON.stringify({type: "role", isGuest: false, roomId}));
}

const joinRoom = (roomId, userId, ws) => {
  console.log("joining room");

  if (!rooms[roomId]) {
    ws.send(JSON.stringify({type: "roomIsNotFound", error: "room isn't exist"}));
    return;
  };
  if (Object.keys(rooms[roomId]).length === 2) {
      ws.send(JSON.stringify({type: "roomFull", error: "the room is already full"}));
      return;
  };
  // const isGuest = Object.keys(rooms[roomId]).length === 1 ? true : false;
  if (!rooms[roomId][userId]) rooms[roomId][userId] = {socket: ws, guest: true, ready: false, score: 0};
  ws.send(JSON.stringify({type: "role", isGuest: true, roomId}));
  Object.entries(rooms[roomId]).forEach(([id, user]) => {
    if (id !== userId) {
      user.socket.send(JSON.stringify({type: "enter", message: "player has entered the game", isTwoPlayers: true, rooms: Object.keys(rooms)}));
    }
  });
  console.log(Object.entries(rooms).length);

}

const leaveRoom = (roomId, userId) => {
  if (!rooms[roomId][userId]) return;

  if (!rooms[roomId][userId].guest) {
    Object.entries(rooms[roomId]).forEach(([id, user]) => {
      user.socket.send(JSON.stringify({type: "deleteRoom" }));
  });
    delete rooms[roomId];
    return;
  }
  delete rooms[roomId][userId];

  Object.entries(rooms[roomId]).forEach(([id, user]) => {
    if (id !== userId) {
      user.socket.send(JSON.stringify({type: "leave", message: "player leaves room", isTwoPlayers: false}));
    }
  });
  console.log(Object.entries(rooms).length);
};

const getReady = (roomId, userId) => {
  console.log("hello");
  rooms[roomId][userId].ready = true;
  Object.entries(rooms[roomId]).forEach(([id, user]) => {
    if (id !== userId) {
      user.socket.send(JSON.stringify({type: "opponentReady", message: "opponent is ready!"}));
    }
  });
  if(Object.values(rooms[roomId]).every(player => player.ready === true)) {
    startGame(roomId);
  }
}

const startGame = (roomId) => {
  Object.entries(rooms[roomId]).forEach(([_, user]) => {
    user.socket.send(JSON.stringify({type: "gameStarting"}));
});
}

const movePlatform = (platformLocation, roomId, userId) => {
  Object.entries(rooms[roomId]).forEach(([id, user]) => {
    if (id !== userId) {
      user.socket.send(JSON.stringify({type: "platformMoved", platformLocation}));
    }
  });
};

const resetBall = (roomId, scoredPlayer) => {
  console.log("resetting");
  const scoredPlayerId = Object.keys(rooms[roomId])[scoredPlayer];
  rooms[roomId][scoredPlayerId].score++
  const newScore = Object.values(rooms[roomId]).map((player) => {
      return player.score;
    }, []);

  Object.entries(rooms[roomId]).forEach(([_, user]) => {
      user.socket.send(JSON.stringify({type: "newScore", score: newScore}));
  });
}

