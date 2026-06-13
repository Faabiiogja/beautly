import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@beautly.com";
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 10) {
    throw new Error(
      "Defina ADMIN_PASSWORD (mínimo 10 caracteres) antes de rodar o seed. " +
        "Nunca use senha padrão em produção.",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} ja existe.`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "PLATFORM_ADMIN",
    },
  });
  console.log(`Admin criado: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
