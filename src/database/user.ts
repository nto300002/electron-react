import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth';
import { z } from 'zod';
import { getPrismaClient } from './prisma';

const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'パスワードには大文字を含める必要があります')
    .regex(/[0-9]/, 'パスワードには数字を含める必要があります'),
});

export interface UserInput {
  name: string;
  email: string;
  password: string;
  is_active?: boolean;
  user_icon?: string;
}

export const createUser = async (userData: UserInput) => {
  const prisma = getPrismaClient();
  const validatedUser = createUserSchema.parse(userData);

  const hashedPassword = await hashPassword(validatedUser.password);

  return prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password_hash: hashedPassword,
      is_active: userData.is_active ?? true,
      user_icon: userData.user_icon ?? 'default',
    },
  });
};

export const getUserByEmail = async (email: string) => {
  const prisma = getPrismaClient();
  return prisma.user.findUnique({
    where: {
      email: email,
    },
  });
};
