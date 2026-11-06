import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Fetch bookings belonging to the authenticated user
export const getMyBookings = async (token) => {
  try {
    const response = await API.get("/bookings/my-bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (
      !response.data.success ||
      !Array.isArray(response.data.data)
    ) {
      throw new Error("Invalid booking history response.");
    }

    return response.data.data;
  } catch (error) {
    console.error(
      "Failed to fetch booking history:",
      error.response?.data || error.message
    );

    throw error;
  }
};