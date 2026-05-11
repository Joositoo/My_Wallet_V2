import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions'
import pool from '../../../../lib/db';

export async function PUT (request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autiroizado' },
                { status: 401 }
            );
        }

        const { name } = await request.json();

        if (!name || name.trim === ''){
            return NextResponse.json(
                { error: 'El nombre es obligatorio' },
                { status: 400 });
        }

        await pool.query('UPDATE usuarios SET nombre = ? WHERE id = ?',
            [ name.trim(), session.user.id]
        );

        return NextResponse.json(
            { mensaje: 'name actualizado'},
            { status: 200 }
        );
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
        { status: 500 });
    }
}