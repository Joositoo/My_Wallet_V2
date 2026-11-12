import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { parseMoney, isValidDate, syncDeudaActiva, TIPOS_PAGO } from "@/lib/deudas";

// Devuelve la deuda a la que pertenece el pago, solo si es del usuario
async function findPagoDelUsuario(pagoId, usuarioId) {
    const [rows] = await pool.query(
        `SELECT p.id, p.deuda_id
         FROM pagos_deuda p
         JOIN deudas d ON p.deuda_id = d.id
         WHERE p.id = ? AND d.usuario_id = ?`,
        [pagoId, usuarioId]
    );
    return rows[0] ?? null;
}

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { pagoId } = await params;
        const { cantidad, fecha, tipo, nota } = await request.json();

        const importe = parseMoney(cantidad);
        const tipoPago = tipo ?? 'cuota';
        const notaLimpia = typeof nota === 'string' ? nota.trim().slice(0, 255) : '';

        if (importe === null || !isValidDate(fecha) || !TIPOS_PAGO.includes(tipoPago)) {
            return NextResponse.json(
                { error: 'Los datos del pago son inválidos' },
                { status: 400 }
            );
        }

        const pago = await findPagoDelUsuario(pagoId, session.user.id);

        if (!pago) {
            return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
        }

        await pool.query(
            'UPDATE pagos_deuda SET cantidad = ?, fecha = ?, tipo = ?, nota = ? WHERE id = ?',
            [importe, fecha, tipoPago, notaLimpia || null, pagoId]
        );

        await syncDeudaActiva(pago.deuda_id);

        return NextResponse.json({ mensaje: 'Pago modificado' }, { status: 200 });
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

        const { pagoId } = await params;

        const pago = await findPagoDelUsuario(pagoId, session.user.id);

        if (!pago) {
            return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
        }

        await pool.query('DELETE FROM pagos_deuda WHERE id = ?', [pagoId]);

        await syncDeudaActiva(pago.deuda_id);

        return NextResponse.json({ mensaje: 'Pago eliminado' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
