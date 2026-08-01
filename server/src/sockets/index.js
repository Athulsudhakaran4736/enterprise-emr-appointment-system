const User = require("../models/User");
const { verifyAccessToken } = require("../utils/token");

const SOCKET_EVENTS = {
  APPOINTMENTS_CHANGED: "appointments:changed",
};

const AUTHENTICATED_ROOM = "authenticated";

let io = null;

const getSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return String(authToken).trim();
  }

  const authorizationHeader = socket.handshake.headers?.authorization;

  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.slice("Bearer ".length).trim();
  }

  return null;
};

const initializeSocketServer = (httpServer) => {
  io = new (require("socket.io").Server)(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const accessToken = getSocketToken(socket);

      if (!accessToken) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAccessToken(accessToken);

      if (decoded.type !== "access" || !decoded.sub) {
        return next(new Error("Invalid access token"));
      }

      const user = await User.findById(decoded.sub).select(
        "_id name email role isActive"
      );

      if (!user || !user.isActive) {
        return next(new Error("Authentication required"));
      }

      socket.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      };

      return next();
    } catch (_error) {
      return next(new Error("Invalid or expired access token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(AUTHENTICATED_ROOM);
    socket.join(`role:${socket.user.role}`);
    socket.join(`user:${socket.user.id}`);
  });

  return io;
};

const getSocketServer = () => io;

const emitAppointmentChanged = (changeType) => {
  if (!io) {
    return;
  }

  io.to(AUTHENTICATED_ROOM).emit(SOCKET_EVENTS.APPOINTMENTS_CHANGED, {
    type: changeType,
    changedAt: new Date().toISOString(),
  });
};

module.exports = {
  SOCKET_EVENTS,
  initializeSocketServer,
  getSocketServer,
  emitAppointmentChanged,
};
