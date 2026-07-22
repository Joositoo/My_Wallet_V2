import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export async function POST (request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { nombre } = await request.json();

        if (!nombre) {
            return NextResponse.json(
                { error: 'Campo vacío' },
                { status: 400 }
            );
        }

        const [result] = await pool.query('INSERT INTO suscripciones (usuario_id, nombre) VALUES (?, ?)',
            [session.user.id, nombre]);
        
            return NextResponse.json(
                { mensaje: "Suscripción creada", id: result.insertId },
                { status: 201 }
            );
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}