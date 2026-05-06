import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';

export async function POST(request) {
    try {
        const { nombre, email, password } = await request.json();

        if (!nombre || !email || !password) {
            return NextResponse.json(
                { error: "Todos los campos son obligatorios" },
                { status: 400 }
            );
        }

        const [existsUser] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (existsUser.length > 0) {
            return NextResponse.json(
                { error: "Email registrado" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query("INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)", 
            [nombre, email, hashedPassword]);

        return NextResponse.json(
            { message: "Usuario registrado", id: result.insertId },
            { status: 201 }
        );

    }catch (error) {
        console.log("Error en el registro: ", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}