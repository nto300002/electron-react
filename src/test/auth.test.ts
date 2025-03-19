import '../test/setup';
import { PrismaClient } from '@prisma/client';
import {
  hashPassword,
  comparePassword,
  authenticateUser,
  createAccessToken,
  getCurrentUser,
} from '../database/auth';
import { createUser, UserInput } from '../database/user';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../database/prisma';

const prisma = getPrismaClient();

describe('ログイン認証', () => {
  beforeAll(async () => {
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});

    const userData = {
      name: 'auth test user',
      email: 'auth@test.com',
      password: 'Password123411',
    };

    // ユーザー作成を実行
    const createdUser = await createUser(userData);
    console.log('作成されたユーザー:', createdUser);

    // 作成直後に検索して確認
    const checkUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    console.log('作成後の確認:', checkUser);

    if (!checkUser) {
      throw new Error('テストユーザーの作成に失敗しました');
    }

    const userInput: UserInput = {
      name: userData.name,
      email: userData.email,
      password: await hashPassword(userData.password),
      is_active: true,
    };

    console.log('UserInput Password Hash:', userInput.password);

    const inactiveUserData = {
      name: 'inactive user',
      email: 'inactive@test.com',
      password: 'Password123',
    };

    await createUser(inactiveUserData);
  });

  test('正しい認証情報でログインできるか', async () => {
    const email = 'auth@test.com';
    const password = 'Password123411';

    // データベースからユーザーを取得して確認
    const dbUser = await prisma.user.findUnique({ where: { email } });
    console.log('テスト前のDBユーザー:', dbUser);

    const result = await authenticateUser(email, password);
    console.log('認証結果:', result);
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });

  test('存在しないユーザーでログイン試行した場合', async () => {
    const email = 'nonexistent@example.com';
    const password = 'Passwordnonexistent';

    const result = await authenticateUser(email, password);
    expect(result.success).toBe(false);
    expect(result.message).toBe('ユーザーが見つかりません');
  });

  test('間違ったパスワードでログイン試行した場合', async () => {
    const email = 'auth@test.com';
    const password = 'WrongPassword3211';

    const result = await authenticateUser(email, password);
    expect(result.success).toBe(false);
    expect(result.message).toBe('パスワードが一致しません');
  });
});

describe('トークン管理', () => {
  let testUser: any;

  beforeAll(async () => {
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});

    const userData = {
      name: 'token test user',
      email: 'token@test.com',
      password: 'Password123411',
    };

    testUser = await createUser(userData);
  });

  test('トークン生成が正常に行われるか', async () => {
    const result = await createAccessToken(testUser);
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.expiresIn).toBeGreaterThan(0);
    expect(result.user).toHaveProperty('id');
    expect(result.user).toHaveProperty('email');
  });

  test('有効期限の設定は正しいか', async () => {
    process.env.ACCESS_TOKEN_EXPIRATION = '5';

    const result = await createAccessToken(testUser);
    expect(result.expiresIn).toBe(1200);
  });

  test('トークンのペイロードに必要な情報が含まれるか', async () => {
    const result = await createAccessToken(testUser);
    const secretKey = process.env.SECRET_KEY || 'default_secret_key';

    const decoded = jwt.verify(result.token, secretKey) as any;

    expect(decoded).toHaveProperty('sub', testUser.id.toString());
    expect(decoded).toHaveProperty('email', testUser.email);
    expect(decoded).toHaveProperty('name', testUser.name);
    expect(decoded).toHaveProperty('exp');
    expect(decoded).toHaveProperty('iat');
  });
});
