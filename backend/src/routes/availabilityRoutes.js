import express from "express";

import {
  checkRoomAvailability,
} from "../controllers/availabilityController.js";

const router = express.Router();

router.get(
  "/:hotelId/availability",
  checkRoomAvailability
);

export default router;