export const socketAsync = (handler) => {
  return async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error("🚨 Controller Error:", error);

      const [io, socket] = args;
      if (socket && typeof socket.emit === "function") {
        socket.emit("room_error", { message: "Internal server error." });
      }
    }
  };
};
