import { pool } from "../src/config/db.js";

const roomTypes = [
  // Taj Fort Aguada Resort & Spa
  {
    hotelId: "6aebce7a23f1078c315b948e",
    name: "Deluxe Room",
    description: "Comfortable room with elegant interiors and garden views.",
    capacity: 2,
    totalRooms: 5,
    price: 1200000,
  },
  {
    hotelId: "6aebce7a23f1078c315b948e",
    name: "Premium Sea View Room",
    description: "Spacious room with beautiful sea views.",
    capacity: 3,
    totalRooms: 3,
    price: 1850000,
  },
  {
    hotelId: "6aebce7a23f1078c315b948e",
    name: "Luxury Suite",
    description: "Premium suite with a separate living area.",
    capacity: 4,
    totalRooms: 2,
    price: 2800000,
  },

  // The Oberoi Udaivilas
  {
    hotelId: "6aebce7a23f1078c315b948f",
    name: "Premier Room",
    description: "Elegant room inspired by traditional Rajasthani design.",
    capacity: 2,
    totalRooms: 5,
    price: 3000000,
  },
  {
    hotelId: "6aebce7a23f1078c315b948f",
    name: "Premier Lake View Room",
    description: "Luxury accommodation with lake views.",
    capacity: 3,
    totalRooms: 3,
    price: 4200000,
  },
  {
    hotelId: "6aebce7a23f1078c315b948f",
    name: "Luxury Suite",
    description: "Spacious suite with premium furnishings.",
    capacity: 4,
    totalRooms: 2,
    price: 6000000,
  },

  // The Leela Palace Bengaluru
  {
    hotelId: "6aebce7a23f1078c315b9490",
    name: "Grand Deluxe Room",
    description: "Comfortable luxury room with garden surroundings.",
    capacity: 2,
    totalRooms: 6,
    price: 1500000,
  },
  {
    hotelId: "6aebce7a23f1078c315b9490",
    name: "Royal Premier Room",
    description: "Premium room with elegant interiors.",
    capacity: 3,
    totalRooms: 3,
    price: 2200000,
  },
  {
    hotelId: "6aebce7a23f1078c315b9490",
    name: "Luxury Suite",
    description: "Spacious suite with a separate living space.",
    capacity: 4,
    totalRooms: 2,
    price: 3500000,
  },

  // Evolve Back, Coorg
  {
    hotelId: "6aebce7a23f1078c315b9491",
    name: "Heritage Pool Villa",
    description: "Private villa surrounded by lush coffee plantations.",
    capacity: 2,
    totalRooms: 5,
    price: 2000000,
  },
  {
    hotelId: "6aebce7a23f1078c315b9491",
    name: "Pool Villa",
    description: "Spacious villa with a private pool.",
    capacity: 3,
    totalRooms: 3,
    price: 2600000,
  },
  {
    hotelId: "6aebce7a23f1078c315b9491",
    name: "Luxury Pool Villa",
    description: "Premium villa with additional living space.",
    capacity: 4,
    totalRooms: 2,
    price: 3800000,
  },
];

async function seedRoomTypes() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const room of roomTypes) {
      await client.query(
        `INSERT INTO room_types (
          hotel_mongo_id,
          name,
          description,
          capacity,
          total_rooms,
          price_per_night_paise
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (hotel_mongo_id, name)
        DO UPDATE SET
          description = EXCLUDED.description,
          capacity = EXCLUDED.capacity,
          total_rooms = EXCLUDED.total_rooms,
          price_per_night_paise = EXCLUDED.price_per_night_paise`,
        [
          room.hotelId,
          room.name,
          room.description,
          room.capacity,
          room.totalRooms,
          room.price,
        ]
      );
    }

    await client.query("COMMIT");

    console.log(
      `Successfully seeded ${roomTypes.length} room types.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Room type seeding failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedRoomTypes();