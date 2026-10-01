import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('MySQL', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('runs SQL and reads back a row it wrote', async () => {
    const name = `zz_vitest_${Date.now()}`;

    const created = await prisma.role.create({
      data: { name, description: 'vitest' },
    });

    try {
      const rows = await prisma.$queryRaw<{ name: string }[]>`
        SELECT name FROM roles WHERE id = ${created.id}
      `;

      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe(name);
    } finally {
      await prisma.role.delete({ where: { id: created.id } });
    }
  });
});
