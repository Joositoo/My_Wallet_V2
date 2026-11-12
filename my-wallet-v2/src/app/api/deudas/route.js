import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { parseMoney, isValidDate } from "@/lib/deudas";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const [rows] = await pool.query(
            `SELECT
                d.id AS deuda_id,
                d.nombre,
                d.precio_total,
                d.cuota_mensual,
                d.activa,
                DATE_FORMAT(d.fecha_alta, '%Y-%m-%d') AS fecha_alta,
                DATE_FORMAT(d.fecha_fin, '%Y-%m-%d') AS fecha_fin,
                p.id AS pago_id,
                p.cantidad,
                DATE_FORMAT(p.fecha, '%Y-%m-%d') AS pago_fecha,
                p.tipo,
                p.nota
            FROM deudas d
            LEFT JOIN pagos_deuda p ON p.deuda_id = d.id
            WHERE d.usuario_id = ?
            ORDER BY d.activa DESC, d.fecha_fin ASC, d.id ASC, p.fecha DESC, p.id DESC`,
            [session.user.id]
        );

        const map = new Map();
        for (const row of rows) {
            if (!map.has(row.deuda_id)) {
                map.set(row.deuda_id, {
                    id: row.deuda_id,
                    nombre: row.nombre,
                    precio_total: Number(row.precio_total),
                    cuota_mensual: Number(row.cuota_mensual),
                    activa: Boolean(row.activa),
                    fecha_alta: row.fecha_alta,
                    fecha_fin: row.fecha_fin,
                    pagos: [],
                });
            }
            if (row.pago_id !== null) {
                map.get(row.deuda_id).pagos.push({
                    id: row.pago_id,
                    cantidad: Number(row.cantidad),
                    fecha: row.pago_fecha,
                    tipo: row.tipo,
                    nota: row.nota ?? "",
                });
            }
        }

        return NextResponse.json(Array.from(map.values()));
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

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

        const [result] = await pool.query(
            'INSERT INTO deudas (usuario_id, nombre, precio_total, cuota_mensual, fecha_fin, activa) VALUES (?, ?, ?, ?, ?, ?)',
            [session.user.id, nombreLimpio, total, cuota, fecha_fin, activa === false ? 0 : 1]
        );

        return NextResponse.json(
            { mensaje: 'Deuda creada', id: result.insertId },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
