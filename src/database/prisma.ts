// src/database/prisma.ts
import { PrismaClient } from '@prisma/client';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let prisma: PrismaClient;

export function getPrismaClient() {
  if (!prisma) {
    // Electronのユーザーデータディレクトリパスを取得
    const userDataPath = app ? app.getPath('userData') : './';
    const dbPath = path.join(userDataPath, 'db.sqlite');

    // schema.prismaのデータソースURLを動的に設定
    process.env.DATABASE_URL = `file:${dbPath}`;

    prisma = new PrismaClient();
  }

  return prisma;
}
