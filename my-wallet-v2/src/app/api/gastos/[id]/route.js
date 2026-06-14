import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from '../../../../lib/db';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;

        const { categoria_id, cantidad, descripcion, fecha } = await request.json();

        if (!categoria_id || !cantidad || !descripcion || !fecha) {
            return NextResponse.json(
                { error: 'Faltan campos obligatorios' },
                { status: 400 }
            );
        }

        if (cantidad <= 0) {
            return NextResponse.json(
                { error: 'La cantidad debe ser mayor a 0.' },
                { status: 400 }
            );
        }
        
        const [rows] = await pool.query('SELECT id FROM gastos WHERE id = ? AND usuario_id = ?', 
            [id, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Gasto no encontrado' },
                {status: 404 }
            );
        }

        const [categoria] = await pool.query('SELECT id FROM categorias WHERE id = ? AND usuario_id = ? AND tipo = "gasto"', 
            [categoria_id, session.user.id]
        );

        if (categoria.length === 0) {
            return NextResponse.json(
                { error: 'Categoría no válida.' },
                {status: 400 }
            );
        }

        await pool.query('UPDATE gastos SET categoria_id = ?, cantidad = ?, descripcion = ?, fecha = ? WHERE id = ?',
            [categoria_id, cantidad, descripcion, fecha, id]
        );        

        return NextResponse.json(
            { mensaje: 'Gasto modificado' },
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

        const [rows] = await pool.query(
            'SELECT id FROM gastos WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Gasto no encontrado' }, 
                { status: 404 }
            );
        }

        await pool.query('DELETE FROM gastos WHERE id = ?', [id]);

        return NextResponse.json(
            { mensaje: 'Gasto eliminado' },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor' }, 
            { status: 500 }
        );
    }
}