import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { parseMoney, isValidDate, syncDeudaActiva } from "@/lib/deudas";

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const { nombre, precio_total, cuota_mensual, fecha_fin, activa } = await request.json();

        const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
        const total = parseMoney(precio_total, 9999999999.99);
        const cuota = parseMoney(cuota_mensual);

        if (!nombreLimpio || nombreLimpio.length > 100) {
            return NextResponse.json(
                { error: 'El nombre es obligatorio (máx. 100 caracteres)' },
                { status: 400 }
            );
        }
        if (total === null || cuota === null) {
            return NextResponse.json(
                { error: 'El importe total y la cuota deben ser mayores que 0' },
                { status: 400 }
            );
        }
        if (!isValidDate(fecha_fin)) {
            return NextResponse.json({ error: 'La fecha de fin no es válida' }, { status: 400 });
        }

        const [rows] = await pool.query(
            'SELECT id FROM deudas WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
        }

        await pool.query(
            'UPDATE deudas SET nombre = ?, precio_total = ?, cuota_mensual = ?, fecha_fin = ?, activa = ? WHERE id = ? AND usuario_id = ?',
            [nombreLimpio, total, cuota, fecha_fin, activa === false ? 0 : 1, id, session.user.id]
        );

        // Si se deja activa pero ya está totalmente pagada, pasa a liquidada
        if (activa !== false) {
            await syncDeudaActiva(id);
        }

        return NextResponse.json({ mensaje: 'Deuda modificada' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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
            'SELECT id FROM deudas WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
        }

        // pagos_deuda se borra en cascada (ON DELETE CASCADE)
        await pool.query(
            'DELETE FROM deudas WHERE id = ? AND usuario_id = ?',
            [id, session.user.id]
        );

        return NextResponse.json({ mensaje: 'Deuda eliminada' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
