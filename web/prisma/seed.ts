import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { resetDatabase } from "../src/lib/resetDatabase";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — configure a Postgres connection string.");
}
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

resetDatabase(prisma)
  .then(() => console.log("Seed complete."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
