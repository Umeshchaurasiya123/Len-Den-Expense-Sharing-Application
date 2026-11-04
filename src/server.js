import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./db/index.js";

const port = process.env.PORT || 5000;

try {
  await connectDB();

  const server = app.listen(port, () => {
    const assignedPort = server.address().port;
    console.log(`Len-Den API listening on port ${assignedPort}`);
  });
} catch (error) {
  console.error("PostgreSQL connection failed:", error);
  process.exit(1);
}
