import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') || new Date().getFullYear();

        const [rows] = await pool.query(
            `SELECT 
                s.id AS susc_id,
                s.nombre AS susc_nombre,
                p.id AS pago_id,
                p.cantidad,
                p.fecha,
                p.nota
            FROM suscripciones s
            LEFT JOIN pagos_suscripcion p 
                ON p.suscripcion_id = s.id
                AND YEAR(p.fecha) = ?
            WHERE s.usuario_id = ?
            ORDER BY s.id, p.fecha DESC`,
            [year, session.user.id]
        );

        const map = new Map();
        for (const row of rows) {
            const suscId = String(row.susc_id);
            if (!map.has(suscId)) {
                map.set(suscId, {
                    id: suscId,
                    nombre: row.susc_nombre,
                    pagos: [],
                });
            }
            if (row.pago_id !== null) {
                map.get(suscId).pagos.push({
                    id: String(row.pago_id),
                    cantidad: Number(row.cantidad),
                    fecha: row.fecha.toISOString().split("T")[0],
                    nota: row.nota ?? "",
                });
            }
        }

        return NextResponse.json(Array.from(map.values()));
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}

export async function POST (request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { suscId, cantidad, fecha, nota } = await request.json();

        if (!suscId || !cantidad || !fecha) {
            return NextResponse.json(
                { error: 'Ningún campo debe quedar vacío' },
                { status: 400 }
            );
        }

        if (cantidad <= 0) {
            return NextResponse.json(
                {error: 'La cantidad debe ser mayor a 0'},
                {status: 400}
            );
        }

        const [result] = await pool.query('INSERT INTO pagos_suscripcion (suscripcion_id, cantidad, fecha, nota) VALUES (?, ?, ?, ?)',
            [suscId, cantidad, fecha, nota.trim()]
        );

        return NextResponse.json(
            { mensaje: "Pago creado", id: result.insertId },
            { status: 201 }
        );
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}