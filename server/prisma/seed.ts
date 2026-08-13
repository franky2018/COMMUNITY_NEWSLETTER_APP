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
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminName = process.env.ADMIN_NAME?.trim();

  if (!adminEmail) {
    throw new Error(
      "ADMIN_EMAIL environment variable is required but not set. Please set ADMIN_EMAIL in your .env file."
    );
  }

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required but not set. Please set ADMIN_PASSWORD in your .env file."
    );
  }

  if (!adminName) {
    throw new Error(
      "ADMIN_NAME environment variable is required but not set. Please set ADMIN_NAME in your .env file."
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error(`ADMIN_EMAIL '${adminEmail}' is not a valid email address.`);
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
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true, role: true },
    });

    if (existingAdmin) {
      console.log(`Admin user with email '${adminEmail}' already exists.`);
      if (existingAdmin.role === "ADMIN") {
        console.log(
          `User is already an ADMIN. Skipping seed to maintain idempotency.`
        );
      } else {
        console.warn(
          `WARNING: User exists but has role '${existingAdmin.role}', not 'ADMIN'. No changes made to protect existing users.`
        );
      }
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log(
      `Successfully created ADMIN user:\n  ID: ${admin.id}\n  Email: ${admin.email}\n  Name: ${admin.name}\n  Role: ${admin.role}\n  Active: ${admin.isActive}\n  Created: ${admin.createdAt.toISOString()}`
    );
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
