import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const rutasProtegidas = [
        '/dashboard',
        '/ingresos-gastos',
        '/suscripciones',
        '/deudas',
        '/categorias',
        '/perfil',
    ];
    const esRutaProtegida = rutasProtegidas.some(
        (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
    );

    if (!token && esRutaProtegida) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/ingresos-gastos/:path*',
        '/suscripciones/:path*',
        '/deudas/:path*',
        '/categorias/:path*',
        '/perfil/:path*',
        '/login',
        '/register',
    ],
};