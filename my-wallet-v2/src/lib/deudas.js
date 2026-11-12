import pool from '@/lib/db';

export const TIPOS_PAGO = ['cuota', 'extraordinario'];

// Convierte a número positivo con 2 decimales. Devuelve null si no es válido.
export function parseMoney(value, max = 99999999.99) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0 || n > max) return null;
    return Math.round(n * 100) / 100;
}

// Comprueba formato YYYY-MM-DD y que sea una fecha real.
export function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(`${value}T12:00:00`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

// La deuda queda activa mientras lo pagado sea menor que el total;
// al llegar al total pasa a inactiva (liquidada).
export async function syncDeudaActiva(deudaId) {
    await pool.query(
        `UPDATE deudas d
         SET d.activa = (
             SELECT COALESCE(SUM(p.cantidad), 0) FROM pagos_deuda p WHERE p.deuda_id = d.id
         ) < d.precio_total
         WHERE d.id = ?`,
        [deudaId]
    );
}
