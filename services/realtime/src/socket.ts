import { Server, Socket } from "socket.io";
import http from "http";
import jwt, { JwtPayload } from "jsonwebtoken";

type SocketJwtPayload = JwtPayload & {
  user?: string;
  role?: string;
  restaurantId?: string;
};

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as SocketJwtPayload;
      if (!decoded.user) {
        return next(new Error("Unauthorized"));
      }

      socket.data.auth = decoded;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      return next(new Error("Unauthorized"));
    }
  });
  io.on("connection", (socket: Socket) => {
    const auth = socket.data.auth as SocketJwtPayload | undefined;
    const userId = auth?.user;
    console.log(`[realtime] socket connected: socket=${socket.id}, user=${userId}`);
    if (!userId) {
      socket.disconnect();
      return;
    }
    socket.join(`user_${userId}`);
    if (auth?.restaurantId) {
      socket.join(`restaurant_${auth.restaurantId}`);
    }
    const joinedRooms = Array.from(socket.rooms).join(", ");
    console.log(
      `[realtime] rooms joined: socket=${socket.id}, user=${userId}, rooms=${joinedRooms}`,
    );
    socket.on("disconnect", () => {
      console.log(`[realtime] socket disconnected: socket=${socket.id}, user=${userId}`);
    });
  });
  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
