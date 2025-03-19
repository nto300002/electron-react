import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByEmail } from './user';
import type { User } from '../../type';

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

// - *1 平文のパスワードとハッシュ化されたパスワードを比較
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
) {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('パスワード比較エラー', error);
    return false;
  }
}

// - *2 パスワードをハッシュ化
export async function hashPassword(password: string) {
  // - *3 パスワードをハッシュ化するhash関数
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('パスワードハッシュ化エラー', error);
    throw error;
  }
}

// - *4 dbにクエリを投げ、フロントエンドから得た情報と一致するデータを取得する関数(session, email, password)
// auth.ts
export async function authenticateUser(email: string, password: string) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'ユーザーが見つかりません' };
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return { success: false, message: 'パスワードが一致しません' };
    }

    return { success: true, user }; // 認証成功時のみuserを返す
  } catch (error) {
    console.error('ユーザー認証エラー', error);
    throw error; // エラーはそのままスロー
  }
}
// User.email === email(取得したもの)
// if ユーザーがいない
// パスワードが一致しない
// False
// それ以外
// return user

// - *5 アクセストークンを作成　(データ　有効期限)
export async function createAccessToken(user: User) {
  try {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      name: user.name,
    };

    const expireMinutes = parseInt(
      process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '30',
      10
    );
    const expiresInSeconds = expireMinutes * 60;

    const secretKey = process.env.SECRET_KEY || 'default_secret_key';

    const token = jwt.sign(payload, secretKey, { expiresIn: expiresInSeconds });

    return {
      token,
      expiresIn: expiresInSeconds,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    console.error('アクセストークン作成エラー', error);
    throw error;
  }
}

// エンコード
// 有効期限
// エンコードしたものに有効期限を設定
// jwtを作成
// jwtを返す

// - *6 現在のユーザー取得
export async function getCurrentUser(token: string) {
  try {
    const secretKey = process.env.SECRET_KEY || 'default_secret_key';

    const decoded = jwt.verify(token, secretKey) as TokenPayload;

    if (!decoded.email) {
      const error = new Error('Invalid token payload');
      (error as any).status = 401;
      throw error;
    }

    const tokenData = {
      email: decoded.email,
      sub: decoded.sub,
      name: decoded.name as string,
    };

    const user = await getUserByEmail(decoded.email);

    if (!user) {
      const authError = new Error('Invalid token');
      (authError as any).status = 401;
      throw authError;
    }

    return {
      tokenData,
      user,
    };
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      const authError = new Error('Invalid token');
      (authError as any).status = 401;
      throw authError;
    }

    console.error('現在のユーザー取得エラー', error);
    throw error;
  }
}

// 例外処理401
// payload デコード処理
// email サブクレームからメールアドレス取得
// emailがない場合 -> 例外処理401
// トークンデータをオブジェクトに格納(email)
// デコードに失敗した場合 -> 例外処理401

// アクセストークンが切れていないか
// dbクエリ->アクセストークン filter
// token === token
// is_active === True
// expires_at > datatime.jstnow
// 最初のレコード取得

// if アクセストークンがない
// 例外処理401

// - *7 現在のアクティブなユーザーを取得
export async function getActiveUser(token: string) {
  try {
    const { user } = await getCurrentUser(token);

    if (!user.is_active) {
      const authError = new Error('Invalid token');
      (authError as any).status = 400;
      throw authError;
    }

    return user;
  } catch (error) {}
}
// if カレントユーザーがアクティブでない
// 400 無効なユーザー
// そうでない
// 現在のユーザーを返す
