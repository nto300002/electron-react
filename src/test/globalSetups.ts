import { execSync } from 'child_process';
import { join, resolve } from 'path';

export default async function globalSetup() {
  // テスト環境を明示的に設定
  process.env.NODE_ENV = 'test';

  // 絶対パスを使用
  const dbPath = resolve(__dirname, './database/test.sqlite');
  process.env.DATABASE_URL = `file:${dbPath}`;

  console.log('テスト用DBにマイグレーション適用中...');
  console.log('グローバルセットアップ: テスト用DBパス:', dbPath);

  const schemaPath = resolve(__dirname, '../database/prisma/schema.prisma');

  // マイグレーションを実行
  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
    stdio: 'inherit',
  });

  console.log('マイグレーション完了');
}
