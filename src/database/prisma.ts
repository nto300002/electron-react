// src/database/prisma.ts
import { PrismaClient } from '@prisma/client';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let prisma: PrismaClient | undefined = undefined;

export function getPrismaClient() {
  if (!prisma) {
    // テスト環境では明示的なパスを使用
    const isTest = process.env.NODE_ENV === 'test';

    // 一貫したデータベースパスを設定
    if (isTest) {
      // テスト環境では相対パスではなく絶対パスを使用
      const dbPath = path.resolve(
        __dirname,
        '../../src/test/database/test.sqlite'
      );
      process.env.DATABASE_URL = `file:${dbPath}`;
      console.log('テスト用DBパス:', dbPath);
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: isTest ? ['error'] : ['query', 'error', 'warn'],
    });
  }

  return prisma;
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
