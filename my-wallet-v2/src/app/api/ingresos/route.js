import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        console.log(session.user.id);

        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const [AllIncomes] = await pool.query('SELECT * FROM ingresos WHERE usuario_id = ?',
            [session.user.id]
        );
        const [currentMonth] = await pool.query('SELECT SUM(cantidad) FROM ingresos WHERE usuario_id = ? AND MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())',
            [session.user.id]
        );
        const [currentYear] = await pool.query('SELECT SUM(cantidad) FROM ingresos WHERE usuario_id = ? AND YEAR(fecha) = YEAR(CURRENT_DATE())',
            [session.user.id]
        )

        return NextResponse.json(
            {
                incomes: AllIncomes,
                currentMonth: currentMonth[0]['SUM(cantidad)'] || 0,
                currentYear: currentYear[0]['SUM(cantidad)'] || 0,
            },
            { status: 200 }
        );
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autiroizado' },
                { status: 401 }
            );
        }

        const { categoria_id, cantidad, descripcion, fecha } = await request.json();

        if (!categoria_id || !cantidad || !descripcion || !fecha) {
            return NextResponse.json(
                { error: 'Ningún campo debe quedar vacío' },
                { status: 400 }
            );
        }

        if (cantidad <= 0) {
            return NextResponse.json(
                { error: 'La cantidad debe ser mayor que 0' },
                { status: 400 }
            );
        }

        const [categoria] = await pool.query('SELECT id FROM categorias WHERE id = ? AND usuario_id = ? AND tipo = "ingreso"',
            [categoria_id, session.user.id]
        );

        if (categoria.length === 0) {
            return NextResponse.json(
                { error: 'Categoría no encontrada' },
                { status: 400 }
            );
        }
        console.log(session.user.id, categoria_id, cantidad, descripcion, fecha);

        const [result] = await pool.query('INSERT INTO ingresos (usuario_id, categoria_id, cantidad, descripcion, fecha) VALUES (?, ?, ?, ?, ?)',
            [session.user.id, categoria_id, cantidad, descripcion.trim(), fecha]
        );

        return NextResponse.json(
            { mensaje: "Ingreso creado", id: result.insertId },
            { status: 201 });
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}