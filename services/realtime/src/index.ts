import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.js";
import internalRouter from "./routes/internal.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
  res.send("ok");
});
app.use("/internal", internalRouter);
app.use("/api/internal", internalRouter);
const server = http.createServer(app);
app.use("/api/v1/internal", internalRouter);

initSocket(server);

export default server;

if (!process.env.VERCEL || process.env.PORT) {
  server.listen(process.env.PORT || 3001, () => {
    console.log(
      `[realtime] server listening on port ${process.env.PORT || 3001}`,
    );
  });
}
