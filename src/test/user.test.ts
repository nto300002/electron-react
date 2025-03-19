import './setup';

import {
  hashPassword,
  comparePassword,
  authenticateUser,
} from '../database/auth';

import { createUser, getUserByEmail, UserInput } from '../database/user';
import { getPrismaClient } from '../database/prisma';

const prisma = getPrismaClient();

describe('ユーザーCRUD操作', () => {
  beforeEach(async () => {
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});
  });

  //新規ユーザー作成
  test('新規ユーザー作成', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password3290188',
    };

    const user = await createUser(userData);
    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);

    //データベースに保存されていることを確認
    const savedUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(savedUser).toBeDefined();
  });

  test('同じメールアドレスのユーザーを重複して作成できないか', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'pAssword3290188',
    };

    await createUser(userData);

    try {
      await createUser(userData);
      fail('ユーザーが重複して登録できてしまった');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.code).toBe('P2002');
      expect(error.meta.target).toEqual(['email']);
    }
  });

  test('ユーザー情報の取得(email)', async () => {
    const userData = {
      name: 'Retriecal Test',
      email: 'get@example.com',
      password: 'Password123411',
    };

    await createUser(userData);

    const retrievedUser = await getUserByEmail(userData.email);
    expect(retrievedUser).toBeDefined();
    expect(retrievedUser?.name).toBe(userData.name);
    expect(retrievedUser?.email).toBe(userData.email);
  });
});

describe('パスワード関連', () => {
  test('パスワードが適切にハッシュ化されて保存されているか', async () => {
    const password = 'securePassword32';
    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword).toBeDefined();
  });

  test('正しいパスワードで比較するとtrueが返されるか', async () => {
    const password = 'Correctpassword3221';
    const hashedPassword = await hashPassword(password);

    const isMatch = await comparePassword(password, hashedPassword);
    expect(isMatch).toBe(true);
  });

  test('間違ったパスワードで比較するとfalseが返されるか', async () => {
    const password = 'Correctpassword3221';
    const wrongPassword = 'WrongPassword123';
    const hashedPassword = await hashPassword(password);

    const isMatch = await comparePassword(wrongPassword, hashedPassword);
    expect(isMatch).toBe(false);
  });

  test('saltRoundsが適切に設定されているか', async () => {
    const password = 'SecurePassword32';
    const hashedPassword = await hashPassword(password);

    const saltRounds = hashedPassword.split('$')[2];
    expect(saltRounds).toBe('12');
  });
});
