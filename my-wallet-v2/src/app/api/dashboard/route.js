import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { toISODate, getStatus, paidAmount } from "@/lib/deudasUtils";

const MESES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGO = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const PERIODOS = ["mes", "3meses", "anio"];

const num = (v) => Number(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;
const round1 = (n) => Math.round(n * 10) / 10;

// Devuelve el rango del periodo seleccionado y el periodo anterior equivalente
function getRangos(periodo, now) {
    const y = now.getFullYear();
    const m = now.getMonth();
    let inicio, fin, prevInicio, prevFin;

    if (periodo === "anio") {
        inicio = new Date(y, 0, 1);
        fin = new Date(y, 11, 31);
        prevInicio = new Date(y - 1, 0, 1);
        prevFin = new Date(y - 1, 11, 31);
    } else if (periodo === "3meses") {
        inicio = new Date(y, m - 2, 1);
        fin = new Date(y, m + 1, 0);
        prevInicio = new Date(y, m - 5, 1);
        prevFin = new Date(y, m - 2, 0);
    } else {
        inicio = new Date(y, m, 1);
        fin = new Date(y, m + 1, 0);
        prevInicio = new Date(y, m - 1, 1);
        prevFin = new Date(y, m, 0);
    }

    return {
        inicio: toISODate(inicio),
        fin: toISODate(fin),
        prevInicio: toISODate(prevInicio),
        prevFin: toISODate(prevFin),
    };
}

// `tabla` es siempre una constante interna ("ingresos" | "gastos"), nunca input del usuario
async function sumaRango(tabla, userId, desde, hasta) {
    const [rows] = await pool.query(
        `SELECT COALESCE(SUM(cantidad), 0) AS total FROM ${tabla} WHERE usuario_id = ? AND fecha BETWEEN ? AND ?`,
        [userId, desde, hasta]
    );
    return num(rows[0].total);
}

async function totalesPorMes(tabla, userId, desde, hasta) {
    const [rows] = await pool.query(
        `SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, SUM(cantidad) AS total
         FROM ${tabla}
         WHERE usuario_id = ? AND fecha BETWEEN ? AND ?
         GROUP BY mes`,
        [userId, desde, hasta]
    );
    return new Map(rows.map((r) => [r.mes, num(r.total)]));
}

async function totalesPorCategoria(tabla, userId, desde, hasta) {
    const [rows] = await pool.query(
        `SELECT COALESCE(c.nombre, 'Sin categoría') AS nombre, SUM(t.cantidad) AS total
         FROM ${tabla} t
         LEFT JOIN categorias c ON c.id = t.categoria_id
         WHERE t.usuario_id = ? AND t.fecha BETWEEN ? AND ?
         GROUP BY t.categoria_id, c.nombre
         ORDER BY total DESC`,
        [userId, desde, hasta]
    );
    return rows;
}

// Agrupa las categorías: las principales y un "Otros" con el resto
function agruparCategorias(rows, maxItems) {
    const total = round2(rows.reduce((s, r) => s + num(r.total), 0));
    const corte = rows.length > maxItems ? maxItems - 1 : rows.length;
    const items = rows.slice(0, corte).map((r) => ({ nombre: r.nombre, importe: round2(num(r.total)) }));
    if (rows.length > corte) {
        items.push({
            nombre: "Otros",
            importe: round2(rows.slice(corte).reduce((s, r) => s + num(r.total), 0)),
        });
    }
    return {
        total,
        items: items.map((i) => ({ ...i, porcentaje: total ? round1((i.importe / total) * 100) : 0 })),
    };
}

function variacionPct(actual, anterior) {
    if (!anterior) return null;
    return round1(((actual - anterior) / Math.abs(anterior)) * 100);
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const periodoParam = searchParams.get("periodo");
        const periodo = PERIODOS.includes(periodoParam) ? periodoParam : "mes";

        const now = new Date();
        const hoy = toISODate(now);
        const y = now.getFullYear();
        const m = now.getMonth();
        const rango = getRangos(periodo, now);

        // Ventana de los últimos 6 meses (gráfica de ingresos y gastos)
        const seisInicio = toISODate(new Date(y, m - 5, 1));
        const seisFin = toISODate(new Date(y, m + 1, 0));

        const [
            ingresos,
            gastos,
            ingresosPrev,
            gastosPrev,
            ingresos6,
            gastos6,
            ingresosAnio,
            gastosAnio,
            catGastos,
            catIngresos,
            [suscRows],
            [deudasRows],
            [pagosRows],
            [movimientos],
        ] = await Promise.all([
            sumaRango("ingresos", userId, rango.inicio, rango.fin),
            sumaRango("gastos", userId, rango.inicio, rango.fin),
            sumaRango("ingresos", userId, rango.prevInicio, rango.prevFin),
            sumaRango("gastos", userId, rango.prevInicio, rango.prevFin),
            totalesPorMes("ingresos", userId, seisInicio, seisFin),
            totalesPorMes("gastos", userId, seisInicio, seisFin),
            totalesPorMes("ingresos", userId, `${y}-01-01`, `${y}-12-31`),
            totalesPorMes("gastos", userId, `${y}-01-01`, `${y}-12-31`),
            totalesPorCategoria("gastos", userId, rango.inicio, rango.fin),
            totalesPorCategoria("ingresos", userId, rango.inicio, rango.fin),
            pool.query(
                `SELECT s.id, s.nombre, COALESCE(SUM(p.cantidad), 0) AS total
                 FROM suscripciones s
                 LEFT JOIN pagos_suscripcion p ON p.suscripcion_id = s.id AND YEAR(p.fecha) = ?
                 WHERE s.usuario_id = ?
                 GROUP BY s.id, s.nombre
                 ORDER BY total DESC, s.nombre ASC`,
                [y, userId]
            ),
            pool.query(
                `SELECT id, nombre, precio_total, cuota_mensual, activa,
                        DATE_FORMAT(fecha_alta, '%Y-%m-%d') AS fecha_alta,
                        DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin
                 FROM deudas
                 WHERE usuario_id = ?`,
                [userId]
            ),
            pool.query(
                `SELECT p.deuda_id, p.cantidad, p.tipo, DATE_FORMAT(p.fecha, '%Y-%m-%d') AS fecha
                 FROM pagos_deuda p
                 JOIN deudas d ON d.id = p.deuda_id
                 WHERE d.usuario_id = ?`,
                [userId]
            ),
            pool.query(
                `(SELECT i.id, DATE_FORMAT(i.fecha, '%Y-%m-%d') AS fecha, i.fecha AS orden, i.descripcion,
                         COALESCE(c.nombre, 'Sin categoría') AS categoria, i.cantidad, 'ingreso' AS tipo
                  FROM ingresos i LEFT JOIN categorias c ON c.id = i.categoria_id
                  WHERE i.usuario_id = ?)
                 UNION ALL
                 (SELECT g.id, DATE_FORMAT(g.fecha, '%Y-%m-%d') AS fecha, g.fecha AS orden, g.descripcion,
                         COALESCE(c.nombre, 'Sin categoría') AS categoria, g.cantidad, 'gasto' AS tipo
                  FROM gastos g LEFT JOIN categorias c ON c.id = g.categoria_id
                  WHERE g.usuario_id = ?)
                 ORDER BY orden DESC, id DESC
                 LIMIT 8`,
                [userId, userId]
            ),
        ]);

        // ── KPIs del periodo ──
        const balance = ingresos - gastos;
        const balancePrev = ingresosPrev - gastosPrev;
        const ahorro = ingresos > 0 ? (balance / ingresos) * 100 : 0;
        const ahorroPrev = ingresosPrev > 0 ? (balancePrev / ingresosPrev) * 100 : null;

        const kpis = {
            ingresos: round2(ingresos),
            gastos: round2(gastos),
            balance: round2(balance),
            tasaAhorro: round1(ahorro),
            variaciones: {
                ingresos: variacionPct(ingresos, ingresosPrev),
                gastos: variacionPct(gastos, gastosPrev),
                balance: variacionPct(balance, balancePrev),
                // diferencia en puntos porcentuales
                tasaAhorro: ahorroPrev === null ? null : round1(ahorro - ahorroPrev),
            },
        };

        // ── Últimos 6 meses ──
        const mensual = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(y, m - 5 + i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const ing = ingresos6.get(key) ?? 0;
            const gas = gastos6.get(key) ?? 0;
            mensual.push({
                mes: MESES_CORTO[d.getMonth()],
                ingresos: round2(ing),
                gastos: round2(gas),
            });
        }
        const balance6Meses = round2(mensual.reduce((s, x) => s + x.ingresos - x.gastos, 0));

        // ── Año en curso (balance acumulado) ──
        const anualMeses = [];
        let acumulado = 0;
        let mejor = null;
        let peor = null;
        for (let i = 0; i <= m; i++) {
            const key = `${y}-${String(i + 1).padStart(2, "0")}`;
            const ing = ingresosAnio.get(key) ?? 0;
            const gas = gastosAnio.get(key) ?? 0;
            const neto = ing - gas;
            acumulado += neto;
            anualMeses.push({ mes: MESES_CORTO[i], balance: round2(acumulado) });
            if (ing !== 0 || gas !== 0) {
                if (!mejor || neto > mejor.neto) mejor = { mes: MESES_LARGO[i], neto: round2(neto) };
                if (!peor || neto < peor.neto) peor = { mes: MESES_LARGO[i], neto: round2(neto) };
            }
        }
        const anual = {
            anio: y,
            meses: anualMeses,
            balanceTotal: round2(acumulado),
            mejor,
            peor,
        };

        // ── Suscripciones (año en curso) ──
        const suscripciones = {
            anio: y,
            cantidad: suscRows.length,
            gastoAnual: round2(suscRows.reduce((s, r) => s + num(r.total), 0)),
            top: suscRows.slice(0, 4).map((r) => ({ id: r.id, nombre: r.nombre, importe: round2(num(r.total)) })),
        };

        // ── Deudas ──
        const pagosPorDeuda = new Map();
        for (const p of pagosRows) {
            if (!pagosPorDeuda.has(p.deuda_id)) pagosPorDeuda.set(p.deuda_id, []);
            pagosPorDeuda.get(p.deuda_id).push({ cantidad: num(p.cantidad), tipo: p.tipo, fecha: p.fecha });
        }
        const deudasCalc = deudasRows.map((d) => {
            const deuda = {
                id: d.id,
                nombre: d.nombre,
                precio_total: num(d.precio_total),
                cuota_mensual: num(d.cuota_mensual),
                activa: Boolean(d.activa),
                fecha_alta: d.fecha_alta,
                fecha_fin: d.fecha_fin,
                pagos: pagosPorDeuda.get(d.id) ?? [],
            };
            const pagado = paidAmount(deuda);
            return {
                ...deuda,
                estado: getStatus(deuda, hoy),
                pagado,
                pendiente: Math.max(0, deuda.precio_total - pagado),
            };
        });
        const abiertas = deudasCalc.filter((d) => d.estado !== "Liquidada");
        const totalDeudas = deudasCalc.reduce((s, d) => s + d.precio_total, 0);
        const pagadoDeudas = deudasCalc.reduce((s, d) => s + d.pagado, 0);
        const ordenEstado = { Retrasada: 0, Activa: 1, Liquidada: 2 };
        const deudas = {
            cantidad: deudasCalc.length,
            pendiente: round2(abiertas.reduce((s, d) => s + d.pendiente, 0)),
            cuotaMensual: round2(abiertas.reduce((s, d) => s + d.cuota_mensual, 0)),
            progreso: totalDeudas ? round1((pagadoDeudas / totalDeudas) * 100) : 0,
            retrasadas: deudasCalc.filter((d) => d.estado === "Retrasada").length,
            top: deudasCalc
                .slice()
                .sort((a, b) => ordenEstado[a.estado] - ordenEstado[b.estado] || b.pendiente - a.pendiente)
                .slice(0, 3)
                .map((d) => ({
                    id: d.id,
                    nombre: d.nombre,
                    estado: d.estado,
                    progreso: Math.min(100, round1((d.pagado / d.precio_total) * 100)),
                })),
        };

        const vacio = movimientos.length === 0 && suscRows.length === 0 && deudasRows.length === 0;

        return NextResponse.json({
            periodo,
            rango: { inicio: rango.inicio, fin: rango.fin },
            vacio,
            kpis,
            mensual,
            balance6Meses,
            anual,
            categorias: {
                gastos: agruparCategorias(catGastos, 5),
                ingresos: agruparCategorias(catIngresos, 3),
            },
            suscripciones,
            deudas,
            movimientos: movimientos.map((mv) => ({
                id: `${mv.tipo}-${mv.id}`,
                fecha: mv.fecha,
                descripcion: mv.descripcion ?? "",
                categoria: mv.categoria,
                cantidad: num(mv.cantidad),
                tipo: mv.tipo,
            })),
        });
    } catch (error) {
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
