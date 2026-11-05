import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "../src/models/Hotel.js";

const hotels = [
  {
    name: "Taj Fort Aguada Resort & Spa",
    location: "Sinquerim, Candolim, Goa",
    address: "Sinquerim, Candolim, Goa 403515, India",
    category: "Beachfront",
    description:
      "A coastal retreat overlooking the Arabian Sea, with landscaped grounds, relaxed luxury, and access to the beaches of North Goa.",
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900",
    pricePerNightINR: 18500,
    rating: 4.9,
    reviewCount: 328,
    amenities: [
      "Free Wi-Fi",
      "Breakfast",
      "Swimming pool",
      "Spa",
      "Sea views",
    ],
    isFeatured: true,
    isActive: true,
  },
  {
    name: "The Oberoi Udaivilas",
    location: "Lake Pichola, Udaipur, Rajasthan",
    address: "Haridasji Ki Magri, Udaipur, Rajasthan 313001, India",
    category: "Luxury",
    description:
      "An elegant lakeside escape inspired by the palaces and architectural heritage of Rajasthan.",
    imageUrl:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900",
    pricePerNightINR: 42000,
    rating: 4.9,
    reviewCount: 216,
    amenities: [
      "Free Wi-Fi",
      "Breakfast",
      "Swimming pool",
      "Spa",
      "Lake views",
    ],
    isFeatured: true,
    isActive: true,
  },
  {
    name: "The Leela Palace Bengaluru",
    location: "Old Airport Road, Bengaluru, Karnataka",
    address: "23, Old Airport Road, Bengaluru, Karnataka 560008, India",
    category: "City Hotels",
    description:
      "A refined city stay surrounded by landscaped gardens, with convenient access to Bengaluru's business and dining districts.",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900",
    pricePerNightINR: 22000,
    rating: 4.8,
    reviewCount: 194,
    amenities: [
      "Free Wi-Fi",
      "Breakfast",
      "Swimming pool",
      "Fitness centre",
      "Dining",
    ],
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Evolve Back, Coorg",
    location: "Siddapur, Coorg, Karnataka",
    address: "Karadigodu Post, Siddapur, Coorg, Karnataka 571253, India",
    category: "Resorts",
    description:
      "A nature-led retreat set among the coffee plantations and green hills of Coorg.",
    imageUrl:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900",
    pricePerNightINR: 26000,
    rating: 4.9,
    reviewCount: 287,
    amenities: [
      "Free Wi-Fi",
      "Breakfast",
      "Swimming pool",
      "Nature experiences",
      "Dining",
    ],
    isFeatured: true,
    isActive: true,
  },
];

async function seedHotels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB.");

    // Remove only existing demo hotel records before reseeding.
    await Hotel.deleteMany({
      name: {
        $in: hotels.map((hotel) => hotel.name),
      },
    });

    const insertedHotels = await Hotel.insertMany(hotels);

    console.log(`Successfully inserted ${insertedHotels.length} hotels.`);

    insertedHotels.forEach((hotel) => {
      console.log(`${hotel.name} — ${hotel._id}`);
    });
  } catch (error) {
    console.error("Hotel seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

seedHotels();