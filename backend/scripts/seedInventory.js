import { pool } from "../src/config/db.js";

const DAYS_TO_GENERATE = 90;

async function seedInventory() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const roomTypesResult = await client.query(`
      SELECT id, total_rooms
      FROM room_types
    `);

    const roomTypes = roomTypesResult.rows;

    if (roomTypes.length === 0) {
      throw new Error("No room types found. Seed room types first.");
    }

    let insertedCount = 0;

    for (const room of roomTypes) {
      for (let day = 0; day < DAYS_TO_GENERATE; day++) {
        const result = await client.query(
          `INSERT INTO room_inventory (
            room_type_id,
            stay_date,
            total_rooms,
            available_rooms
          )
          VALUES (
            $1,
            CURRENT_DATE + ($2::INTEGER),
            $3,
            $3
          )
          ON CONFLICT (room_type_id, stay_date)
          DO NOTHING`,
          [room.id, day, room.total_rooms]
        );

        insertedCount += result.rowCount;
      }
    }

    await client.query("COMMIT");

    console.log("Inventory seeding completed!");
    console.log(`Room types processed: ${roomTypes.length}`);
    console.log(`Inventory records inserted: ${insertedCount}`);
    console.log(`Days generated: ${DAYS_TO_GENERATE}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Inventory seeding failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedInventory();