import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'email', type: 'email' },
                password: { label: 'password', type: 'password' },
            },
            async authorize(credentials) {
                const [rows] = await pool.query(
                    'SELECT * FROM usuarios WHERE email = ?',
                    [credentials.email]
                );

                const user = rows[0];
                
                if (!user) return null;

                const validPassword = await bcrypt.compare(
                    credentials.password,
                    user.password_hash
                );

                if (!validPassword) return null;

                return {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.nombre = user.nombre;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.nombre = token.nombre;
            session.user.email = token.email;
            return session;
        },
    },

    pages: {
        signIn: '/login',
    },

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60
    },

    secret: process.env.NEXTAUTH_SECRET,
};