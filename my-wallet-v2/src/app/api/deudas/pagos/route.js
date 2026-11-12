import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { parseMoney, isValidDate, syncDeudaActiva, TIPOS_PAGO } from "@/lib/deudas";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { deudaId, cantidad, fecha, tipo, nota } = await request.json();

        const importe = parseMoney(cantidad);
        const tipoPago = tipo ?? 'cuota';
        const notaLimpia = typeof nota === 'string' ? nota.trim().slice(0, 255) : '';

        if (!deudaId || importe === null || !isValidDate(fecha) || !TIPOS_PAGO.includes(tipoPago)) {
            return NextResponse.json(
                { error: 'Los datos del pago son inválidos' },
                { status: 400 }
            );
        }

        const [rows] = await pool.query(
            'SELECT id FROM deudas WHERE id = ? AND usuario_id = ?',
            [deudaId, session.user.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
        }

        const [result] = await pool.query(
            'INSERT INTO pagos_deuda (deuda_id, cantidad, fecha, tipo, nota) VALUES (?, ?, ?, ?, ?)',
            [deudaId, importe, fecha, tipoPago, notaLimpia || null]
        );

        await syncDeudaActiva(deudaId);

        return NextResponse.json(
            { mensaje: 'Pago creado', id: result.insertId },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
