import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || 'placeholder',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'placeholder',
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || 'placeholder',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || 'placeholder',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        const res = await query('SELECT * FROM users WHERE email = $1', [credentials.email]);
        if (res.rows.length === 0) {
          throw new Error('No user found with this email address');
        }

        const user = res.rows[0];

        if (user.is_blocked) {
          throw new Error('This account has been blocked by administrators');
        }

        if (!user.password_hash) {
          throw new Error(`This account was registered using ${user.provider || 'social'} sign-in. Please use that method.`);
        }

        const passwordMatch = bcrypt.compareSync(credentials.password, user.password_hash);
        if (!passwordMatch) {
          throw new Error('Incorrect password. Please try again.');
        }

        const cleanImage = user.image && user.image.startsWith('data:image/') ? null : user.image;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: cleanImage
        };
      }
    })
  ],
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || undefined,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const provider = account?.provider || 'unknown';
      if (provider === 'credentials') {
        return true;
      }
      try {
        const checkRes = await query('SELECT id, is_blocked FROM users WHERE email = $1', [user.email]);
        if (checkRes.rows.length > 0) {
          const dbUser = checkRes.rows[0];
          if (dbUser.is_blocked) {
            return false; // Reject sign-in if blocked
          }
          await query(
            'UPDATE users SET name = $1, image = $2, provider = $3, updated_at = CURRENT_TIMESTAMP WHERE email = $4',
            [user.name || null, user.image || null, provider, user.email]
          );
          user.id = dbUser.id;
        } else {
          const insertRes = await query(
            'INSERT INTO users (name, email, image, provider) VALUES ($1, $2, $3, $4) RETURNING id',
            [user.name || null, user.email, user.image || null, provider]
          );
          user.id = insertRes.rows[0].id;
        }
        return true;
      } catch (err) {
        console.error('Error saving user on signIn:', err);
        return false;
      }
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      if (account) {
        token.provider = account.provider;
      }

      // Handle custom updates triggered from client update()
      if (trigger === 'update' && session?.user) {
        if (session.user.email) {
          token.email = session.user.email;
        }
      }

      // Sync latest email / user ID from the database to JWT token
      if (token.id) {
        try {
          const res = await query('SELECT id, email FROM users WHERE id = $1', [token.id]);
          if (res.rows.length > 0) {
            token.email = res.rows[0].email;
          } else if (token.email) {
            const emailRes = await query('SELECT id FROM users WHERE email = $1', [token.email]);
            if (emailRes.rows.length > 0) {
              token.id = emailRes.rows[0].id;
            }
          }
        } catch (e) {
          console.error('Error syncing latest email in jwt callback:', e);
        }
      }

      // Ensure we delete any base64 picture from JWT token to prevent cookie size overflow
      if (token.picture && typeof token.picture === 'string' && token.picture.startsWith('data:image/')) {
        delete token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as any).role = 'USER';
        
        let provider = token.provider as string;
        let dbImage = null;
        if (token.id) {
          try {
            const res = await query('SELECT provider, image FROM users WHERE id = $1', [token.id]);
            if (res.rows.length > 0) {
              if (!provider) provider = res.rows[0].provider;
              dbImage = res.rows[0].image;
            }
          } catch (e) {
            console.error('Error fetching user data in session callback:', e);
          }
        }
        (session.user as any).provider = provider || 'google';
        if (dbImage) {
          session.user.image = dbImage;
        }
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
