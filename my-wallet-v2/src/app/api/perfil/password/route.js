import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions'
import pool from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export async function PUT (request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autiroizado' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios'},
                { status: 400 }
            );
        }

        const [rows] = await pool.query('SELECT password_hash FROM usuarios WHERE id = ?',
            [session.user.id]
        );

        const usuario = rows[0];

        const validPassword = await bcrypt.compare(currentPassword, usuario.password_hash);

        if (!validPassword) {
            return NextResponse.json(
                { error: "Las contraseñas no coinciden" },
                { status: 401 }
            );
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 12);

        await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?',
            [newHashedPassword, session.user.id]
        );

        return NextResponse.json(
            { mensaje: 'Contraseña actualizada'},
            { status: 200 }
        );
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
        { status: 500 });
    }
}