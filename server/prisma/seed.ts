import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const SALT_ROUNDS = 12;

function getDatabaseUrl(): string {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "Either DIRECT_URL or DATABASE_URL environment variable must be set for seeding."
    );
  }

  return url;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const rawAdminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim();
  const adminPassword = rawAdminPassword?.trim();

  if (!adminEmail) {
    throw new Error(
      "ADMIN_EMAIL environment variable is required but not set. Please set ADMIN_EMAIL in your .env file."
    );
  }

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required but must not be empty or only whitespace. Please set ADMIN_PASSWORD in your .env file."
    );
  }

  if (!adminName) {
    throw new Error(
      "ADMIN_NAME environment variable is required but not set. Please set ADMIN_NAME in your .env file."
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error('ADMIN_EMAIL is not a valid email address.');
  }

  if (adminPassword.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 8 characters long for security."
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });

  try {
    const passwordHash = await bcrypt.hash(rawAdminPassword as string, SALT_ROUNDS);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
      select: {
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (admin.role === "ADMIN" && admin.isActive) {
      console.log("Admin user present and active.");
    } else if (admin.role !== "ADMIN") {
      console.warn(
        "WARNING: A user exists for the configured admin email but is not an ADMIN. No changes were made."
      );
    } else {
      console.log(
        `Successfully created ADMIN user. Active: ${admin.isActive}. Created: ${admin.createdAt.toISOString()}`
      );
    }
  } catch (error) {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
