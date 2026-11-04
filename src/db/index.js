import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your local .env file.");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log("Connected to PostgreSQL through Neon.");
};

export default prisma;
