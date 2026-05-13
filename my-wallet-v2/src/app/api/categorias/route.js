import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export async function GET(){
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'No autiroizado' },
                { status: 401 }
            );
        }

        const [rows] = await pool.query('SELECT * FROM categorias WHERE usuario_id = ?', 
            [session.user.id]
        );

        return NextResponse.json(rows, { status: 200 });
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

        const { nombre, tipo, icono } = await request.json();
        console.log(nombre, tipo, icono);
        
        
        if (!nombre) {
            return NextResponse.json(
                { error: 'El nombre no debe quedar vacío'},
                { status: 400 }
            )
        }

        if (!['ingreso', 'gasto'].includes(tipo)) {
            return NextResponse.json(
                { error: 'Tipo inválido'},
                { status: 400}
            )
        }

        const [result] = await pool.query('INSERT INTO categorias (usuario_id, nombre, tipo, icono) VALUES (?, ?, ?, ?)',
            [session.user.id, nombre.trim(), tipo, icono]
        );

        return NextResponse.json(
            { mensaje: 'Categoría creada', id: result.insertId},
            { status: 201}
        );
    }
    catch (error) {
        console.log(error);
        
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}