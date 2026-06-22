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
        console.log(year);
        
        const [AllIncomes] = await pool.query('SELECT * FROM ingresos WHERE usuario_id = ?',
            [session.user.id],);
        
        const [allMovements] = await pool.query('SELECT *, "ingreso" AS tipo FROM ingresos WHERE usuario_id = ? AND YEAR(fecha) = ? UNION ALL SELECT *, "gasto" AS tipo FROM gastos WHERE usuario_id = ? AND YEAR(fecha) = ? ORDER BY fecha DESC',
            [session.user.id, year, session.user.id, year],);
        
        const [totalAnualIncome] = await pool.query('SELECT SUM(cantidad) FROM ingresos WHERE usuario_id = ? AND YEAR(fecha) = ?',
            [session.user.id, year],);

        const [totalAnnualExpense] = await pool.query('SELECT SUM(cantidad) FROM gastos WHERE usuario_id = ? AND YEAR(fecha) = ?',
            [session.user.id, year],);
            console.log(allMovements);
            
        return NextResponse.json(
            {
                AllIncomes: AllIncomes,
                allMovements: allMovements,
                totalAnualIncome: totalAnualIncome[0]['SUM(cantidad)'] || 0,
                totalAnnualExpense: totalAnnualExpense[0]['SUM(cantidad)'] || 0,
            },
            { status: 200}
        );
    }
    catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor.' },
            { status: 500 });
    }
}