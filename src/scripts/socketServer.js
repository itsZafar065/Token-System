const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Jab admin status update kare, toh sab ko signal bhejo
  socket.on("update-tokens", () => {
    io.emit("refresh-data"); 
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3001, () => {
  console.log("🚀 Socket.io server running on port 3001");
});