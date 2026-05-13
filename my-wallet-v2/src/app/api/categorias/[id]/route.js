import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from '../../../../lib/db';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autiroizado' },
                { status: 401 }
            );
        }

        const { nombre, tipo, icono } = await request.json();
        const { id } = await params;

        if (!nombre) {
            return NextResponse.json(
                { error: 'Nombre obligatorio' },
                { status: 400 }
            )
        }

        const [rows] = await pool.query(
            'SELECT id FROM categorias WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
        }

        await pool.query(
            'UPDATE categorias SET nombre = ?, icono = ? WHERE id = ?',
            [nombre.trim(), icono || null, id]
        );

        return NextResponse.json(
            { mensaje: 'Categoría modificada' },
            { status: 200 }
        )
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autiroizado' },
                { status: 401 }
            );
        }

        const { id } = await params;

        const [rows] = await pool.query('SELECT id FROM categorias WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Categoría no encontrada' },
                { status: 404 }
            )
        }

        const [ingresos] = await pool.query('SELECT id FROM ingresos WHERE categoria_id = ? LIMIT 1',
            [id]
        );

        const [gastos] = await pool.query('SELECT id FROM gastos WHERE categoria_id = ? LIMIT 1',
            [id]
        );

        if (ingresos.length > 0 || gastos.length > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar una categoría con movimientos asociados' },
                { status: 409 }
            )
        }

        await pool.query('DELETE FROM categorias WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        return NextResponse.json(
            { mensaje: 'Categoría eliminada' },
            { status: 200 }
        )
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}