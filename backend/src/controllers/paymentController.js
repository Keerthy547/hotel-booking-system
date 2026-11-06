
import {
  createPayment,
  confirmMockPayment,
  getPaymentStatus,
  PaymentError,
} from "../services/paymentService.js";

// POST /api/payments
// Initialize payment for an authenticated user's booking.
export const initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (
      typeof bookingId !== "string" ||
      !/^[0-9a-fA-F-]{36}$/.test(bookingId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID is required.",
      });
    }

    const payment = await createPayment({
      userId: req.user.userId,
      bookingId,
    });

    return res.status(201).json({
      success: true,
      message: "Payment initialized successfully.",
      data: payment,
    });
  } catch (error) {
    console.error("Payment initialization failed:", error);

    if (error instanceof PaymentError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not initialize payment.",
    });
  }
};

// POST /api/payments/:paymentId/confirm
// Simulate payment success or failure.
export const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { outcome } = req.body;

    if (
      typeof paymentId !== "string" ||
      !/^[0-9a-fA-F-]{36}$/.test(paymentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid payment ID is required.",
      });
    }

    if (!["success", "failure"].includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: "Outcome must be success or failure.",
      });
    }

    const result = await confirmMockPayment({
      userId: req.user.userId,
      paymentId,
      outcome,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("Payment confirmation failed:", error);

    if (error instanceof PaymentError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not process payment.",
    });
  }
};

// GET /api/payments/:paymentId
// Retrieve payment status for the authenticated user.
export const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (
      typeof paymentId !== "string" ||
      !/^[0-9a-fA-F-]{36}$/.test(paymentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid payment ID is required.",
      });
    }

    const payment = await getPaymentStatus({
      userId: req.user.userId,
      paymentId,
    });

    return res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully.",
      data: payment,
    });
  } catch (error) {
    console.error("Payment status retrieval failed:", error);

    if (error instanceof PaymentError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not retrieve payment status.",
    });
  }
};
