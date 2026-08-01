require("dotenv").config();

const http = require("http");

const app = require("./app");
const connectDatabase = require("./config/db");
const { initializeSocketServer } = require("./sockets");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    initializeSocketServer(server);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down...`);

      server.close(async () => {
        await require("mongoose").connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
