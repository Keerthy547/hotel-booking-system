import Hotel from "../models/Hotel.js";

// GET /api/hotels
export const getHotels = async (req, res) => {
  try {
    const {
      location,
      category,
      featured,
      search,
    } = req.query;

    const filter = { isActive: true };

    if (location) {
      filter.location = {
        $regex: location,
        $options: "i",
      };
    }

    if (category) {
      filter.category = category;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const hotels = await Hotel.find(filter).sort({
      isFeatured: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  } catch (error) {
    console.error("Error fetching hotels:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
    });
  }
};

// GET /api/hotels/:id
export const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID",
      });
    }

    const hotel = await Hotel.findOne({
      _id: id,
      isActive: true,
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Error fetching hotel:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel",
    });
  }
};