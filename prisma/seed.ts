import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@beautly.com";
  const password = process.env.ADMIN_PASSWORD;

  // Em deploys de preview a ADMIN_PASSWORD pode não estar definida — skip
  // silencioso em vez de quebrar o build. Nunca criamos admin sem senha.
  if (!password || password.length < 10) {
    console.log(
      "Seed: ADMIN_PASSWORD ausente ou curta — pulando criação do admin " +
        "(normal em preview; em produção, defina ADMIN_PASSWORD).",
    );
    return;
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
