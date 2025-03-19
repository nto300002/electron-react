import { PrismaClient } from '@prisma/client';
import path from 'path';
import { getPrismaClient, disconnectPrisma } from '../database/prisma';

// テスト環境を明示的に設定
process.env.NODE_ENV = 'test';

// 絶対パスを使用して一貫性を確保
const dbPath = path.resolve(__dirname, './database/test.sqlite');
process.env.DATABASE_URL = `file:${dbPath}`;
console.log('Setup: テスト用DBパス:', dbPath);

const prisma = getPrismaClient();

// グローバルな前処理
beforeAll(async () => {
  // テストDBをクリア
  await prisma.userSession.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('テストDBクリア完了');
});

// すべてのテスト後に実行
afterAll(async () => {
  await disconnectPrisma();
});

async function seedTestData(prisma: PrismaClient) {
  const { hashPassword } = require('../database/auth');
  const hashedPassword = await hashPassword('password');

  // // Prisma APIを使用してユーザー作成
  // await prisma.user.create({
  //   data: {
  //     name: 'Test User',
  //     email: 'test@example.com',
  //     password_hash: hashedPassword,
  //     is_active: true,
  //   },
  // });
}
