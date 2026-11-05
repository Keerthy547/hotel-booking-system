import axios from "axios";

// Backend API configuration
const API = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Convert MongoDB hotel records into the format expected by React
const formatHotel = (hotel) => ({
  id: hotel._id,
  name: hotel.name,
  location: hotel.location,
  address: hotel.address || "",
  category: hotel.category,
  description: hotel.description,
  image: hotel.imageUrl,
  price: hotel.pricePerNightINR,
  rating: hotel.rating,
  reviews: hotel.reviewCount,
  amenities: hotel.amenities || [],
  isFeatured: hotel.isFeatured,
});

// Fetch all active hotels
export const getHotels = async (params = {}) => {
  try {
    const response = await API.get("/hotels", { params });

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error("Invalid hotel API response");
    }

    return response.data.data.map(formatHotel);
  } catch (error) {
    console.error(
      "Failed to fetch hotels:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// Fetch a single hotel using its MongoDB ID
export const getHotelById = async (id) => {
  try {
    const response = await API.get(`/hotels/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error("Hotel not found");
    }

    return formatHotel(response.data.data);
  } catch (error) {
    console.error(
      "Failed to fetch hotel details:",
      error.response?.data || error.message
    );

    throw error;
  }
};

export default API;