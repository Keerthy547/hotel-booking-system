import express from "express";

import {
  getRoomTypesByHotel,
} from "../controllers/roomTypeController.js";

const router = express.Router();

router.get("/:hotelId/rooms", getRoomTypesByHotel);

export default router;