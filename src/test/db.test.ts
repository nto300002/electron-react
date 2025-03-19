import '../test/setup';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../database/auth';
import { createUser, getUserByEmail, UserInput } from '../database/user';
import { getPrismaClient } from '../database/prisma';

const prisma = getPrismaClient();

describe('クエリ実行', () => {
  beforeAll(async () => {
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test('SQLインジェクション対策: 安全なパラメータ化', async () => {
    const maliciousEmail = "' OR 1=1 --"; //悪意のあるSQL

    const user = await getUserByEmail(maliciousEmail);

    expect(user).toBeNull();
  });

  test('ユニーク制約違反時の挙動', async () => {
    const userData = {
      name: 'Constraint Test',
      email: 'Constraint@test.com',
      password: 'Password129',
    };

    await createUser(userData);

    try {
      await createUser(userData);
      fail('重複ユーザーの作成が許可されてしまった');
    } catch (error) {
      expect((error as any).code).toBe('P2002');
    }
  });
});

describe('エラー処理', () => {
  test('不正データでのユーザー作成時のエラー', async () => {
    const invalidData = {
      email: 'invalid@test.com',
      password: 'Password39291',
    };

    const invalidUserInput: any = {
      email: invalidData.email,
      password_hash: await hashPassword(invalidData.password),
    };

    try {
      await createUser(invalidUserInput);
      fail('不正なデータでのユーザー作成が許可されてしまった');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
