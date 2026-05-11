import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from '../../../lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const [rows] = await pool.query('SELECT nombre FROM usuarios WHERE ID = ?',
            [session.user.id]
        );

        return NextResponse.json(rows[0], {status: 200 });
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
        { status: 500 });
    }
}