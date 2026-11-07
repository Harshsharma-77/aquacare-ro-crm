import { NextResponse } from 'next/server';
import { getNeonSql } from '@/lib/neonClient';

export async function GET() {
  try {
    const sql = getNeonSql();
    if (!sql) {
      return NextResponse.json({
        connected: false,
        message: 'DATABASE_URL or NEON_DATABASE_URL environment variable is not configured.',
      });
    }

    const result = await sql`SELECT NOW() as current_time, version() as version;`;
    return NextResponse.json({
      connected: true,
      time: result[0]?.current_time,
      version: result[0]?.version,
    });
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message || 'Database connection error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const sql = getNeonSql();
    if (!sql) {
      return NextResponse.json({
        synced: false,
        message: 'Neon DATABASE_URL is not set.',
      });
    }

    const body = await req.json();
    const { action, table, data } = body;

    if (action === 'upsert' && table === 'customers') {
      await sql`
        INSERT INTO customers (id, name, phone, alternate_phone, address, area, google_maps_url, ro_brand, ro_model, installation_date, raw_water_tds, output_tds, notes, status, last_service_date, next_service_due_date, last_service_type, updated_at)
        VALUES (${data.id}, ${data.name}, ${data.phone}, ${data.alternatePhone || null}, ${data.address || ''}, ${data.area || null}, ${data.googleMapsUrl || null}, ${data.roBrand || 'Kent'}, ${data.roModel || 'Standard'}, ${data.installationDate || null}, ${data.rawWaterTds || null}, ${data.outputTds || null}, ${data.notes || null}, ${data.status || 'active'}, ${data.lastServiceDate || null}, ${data.nextServiceDueDate || null}, ${data.lastServiceType || null}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          alternate_phone = EXCLUDED.alternate_phone,
          address = EXCLUDED.address,
          area = EXCLUDED.area,
          google_maps_url = EXCLUDED.google_maps_url,
          ro_brand = EXCLUDED.ro_brand,
          ro_model = EXCLUDED.ro_model,
          raw_water_tds = EXCLUDED.raw_water_tds,
          output_tds = EXCLUDED.output_tds,
          notes = EXCLUDED.notes,
          status = EXCLUDED.status,
          last_service_date = EXCLUDED.last_service_date,
          next_service_due_date = EXCLUDED.next_service_due_date,
          last_service_type = EXCLUDED.last_service_type,
          updated_at = NOW();
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'upsert' && table === 'services') {
      await sql`
        INSERT INTO services (id, customer_id, customer_name, customer_phone, customer_address, ro_brand, ro_model, service_type, service_date, next_due_date, technician_name, parts_used, parts_cost, service_charge, discount, total_amount, payment_status, payment_mode, raw_water_tds, output_tds, remarks)
        VALUES (${data.id}, ${data.customerId}, ${data.customerName}, ${data.customerPhone}, ${data.customerAddress || null}, ${data.roBrand || null}, ${data.roModel || null}, ${data.serviceType}, ${data.serviceDate}, ${data.nextDueDate}, ${data.technicianName}, ${JSON.stringify(data.partsUsed || [])}, ${data.partsCost || 0}, ${data.serviceCharge || 0}, ${data.discount || 0}, ${data.totalAmount || 0}, ${data.paymentStatus || 'paid'}, ${data.paymentMode || 'cash'}, ${data.rawWaterTds || null}, ${data.outputTds || null}, ${data.remarks || null})
        ON CONFLICT (id) DO NOTHING;
      `;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: 'Action completed' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
