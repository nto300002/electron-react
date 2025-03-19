import { getPrismaClient } from '../database/prisma';
import '../test/setup';

const prisma = getPrismaClient();

describe('マイグレーションテスト', () => {
  test('Userテーブルが正しいスキーマを持っているか', async () => {
    // Prismaのintrospectionを使ってテーブル構造を取得
    const rawUserTable = await prisma.$queryRaw`
      PRAGMA table_info(User)
    `;

    const userTable = (rawUserTable as any[]).map((column) => {
      const processedColumn: any = {};
      for (const [key, value] of Object.entries(column)) {
        processedColumn[key] =
          typeof value === 'bigint' ? Number(value) : value;
      }
      return processedColumn;
    });

    // 期待されるカラムが存在するか確認
    const columns = userTable as any[];

    // id列が存在するか
    const idColumn = columns.find((col) => col.name === 'id');
    expect(idColumn).toBeDefined();
    expect(idColumn.type).toBe('INTEGER');
    expect(idColumn.pk).toBe(1); // プライマリーキー

    // email列が存在するか
    const emailColumn = columns.find((col) => col.name === 'email');
    expect(emailColumn).toBeDefined();
    expect(emailColumn.type).toBe('TEXT');

    // password_hash列が存在するか
    const passwordColumn = columns.find((col) => col.name === 'password_hash');
    expect(passwordColumn).toBeDefined();
    expect(passwordColumn.type).toBe('TEXT');
  });

  test('UserSessionテーブルが存在するか', async () => {
    // テーブル一覧を取得
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table'
    `;

    // UserSessionテーブルが存在するか確認
    const tableNames = (tables as any[]).map((t) => t.name);
    expect(tableNames).toContain('UserSession');
  });
});
