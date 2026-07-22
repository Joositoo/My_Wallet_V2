import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const { nombre } = await request.json();

        if (!nombre || nombre.trim() === '') {
            return NextResponse.json(
                { error: 'El nombre de la suscripción no puede estar vacío' },
                { status: 400 }
            );
        }

        const [rows] = await pool.query('SELECT id FROM suscripciones WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Suscripción no encontrada' },
                { status: 404 }
            );
        }

        await pool.query('UPDATE suscripciones SET nombre = ? WHERE id = ? AND usuario_id = ?',
            [nombre, id, session.user.id]
        );

        return NextResponse.json(
            { mensaje: 'Suscripción modificada' },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor' }, 
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;

        const [rows] = await pool.query('SELECT id FROM suscripciones WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Suscripción no encontrada' },
                { status: 404 }
            );
        }

        await pool.query('DELETE FROM suscripciones WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        return NextResponse.json(
            { mensaje: 'Suscripción eliminada' },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor' }, 
            { status: 500 }
        );
    }
}
