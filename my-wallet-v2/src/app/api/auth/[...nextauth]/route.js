import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import pool from '../../../../lib//db';
import { signIn } from 'next-auth/react';
import { Strait } from 'next/font/google';

const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Contraseña', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email  ?', 
                        [credentials.email]
                    );

                    const user = rows[0];

                    if (!user) throw new Error('Usuario no encontrado');

                    const validPassword = await bcrypt.compare(credentials.password, user.password);

                    if (!validPassword) throw new Error('Contraseña incorrecta');

                    return {
                        id: user.id,
                        nombre: user.nombre,
                        email: user.email,
                    };
                }
                catch (error) { throw new Error(error.message); }
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
        async session ({ session, token }) {
            session.user.id = token.id;
            session.user.nombre = token.nombre;
            session.user.email = token.email;
            return session;
        },
    },

    pages: {
        signIn: 'login',
    },

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24* 60 * 60,
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };