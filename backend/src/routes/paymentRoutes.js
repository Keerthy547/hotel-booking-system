import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  initiatePayment,
  confirmPayment,
  getPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", protect, initiatePayment);
router.post("/:paymentId/confirm", protect, confirmPayment);
router.get("/:paymentId", protect, getPayment);

export default router;