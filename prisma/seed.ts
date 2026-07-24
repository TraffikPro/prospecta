import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";

const prisma = new PrismaClient();

type SeedUser = {
  email: string;
  name: string;
  role: UserRole;
  password: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env for seed: ${name}`);
  }
  return value;
}

async function main() {
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const memberPassword = requireEnv("SEED_MEMBER_PASSWORD");

  const users: SeedUser[] = [
    {
      email: "admin@prospecta.test",
      name: "Admin Prospecta",
      role: UserRole.ADMIN,
      password: adminPassword,
    },
    {
      email: "comercial@prospecta.test",
      name: "Comercial Prospecta",
      role: UserRole.MEMBER,
      password: memberPassword,
    },
    {
      email: "operacoes@prospecta.test",
      name: "Operacoes Prospecta",
      role: UserRole.MEMBER,
      password: memberPassword,
    },
  ];

  for (const user of users) {
    const passwordHash = await hashPassword(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        isActive: true,
        mustChangePassword: false,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
        isActive: true,
        // E2E / seed users keep false. New operator accounts: mustChangePassword true.
        mustChangePassword: false,
      },
    });
  }

  console.log(`Seeded ${users.length} users (fictitious @prospecta.test).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
