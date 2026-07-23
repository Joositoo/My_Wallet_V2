import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from '@/lib/db';

export async function PUT(request, {params}) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { pagoId } = await params;
        const { cantidad, fecha, nota } = await request.json();
        
        if (!cantidad || isNaN(cantidad) || cantidad <= 0 || !fecha) {
            return NextResponse.json(
                { error: 'Los datos del pago son inválidos' },
                { status: 400 }
            );
        }

        const [rows] = await pool.query('SELECT id FROM pagos_suscripcion WHERE id = ?',
            [pagoId]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Pago no encontrado' },
                { status: 404 }
            );
        }

        await pool.query('UPDATE pagos_suscripcion SET cantidad = ?, fecha = ?, nota = ? WHERE id = ?',
            [cantidad, fecha, nota, pagoId]
        );

        return NextResponse.json(
            { mensaje: 'Pago modificado' },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor' }, 
            { status: 500 }
        );
    }
}

export async function DELETE(request, {params}) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { pagoId } = await params;
        const { searchParams } = new URL(request.url);
        const suscId = searchParams.get('suscId');

        const [rows] = await pool.query('SELECT p.id FROM pagos_suscripcion p JOIN suscripciones s ON p.suscripcion_id = s.id WHERE p.id = ? AND s.id = ? AND s.usuario_id = ?',
            [pagoId, suscId, session.user.id]
        );
        
        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Pago no encontrado' },
                { status: 404 }
            );
        }

        await pool.query('DELETE FROM pagos_suscripcion WHERE id = ? AND suscripcion_id = ?',
            [pagoId, suscId]
        );

        return NextResponse.json(
            { mensaje: 'Pago eliminado' },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor' }, 
            { status: 500 }
        );
    }
}