const slotService = require("../services/slot.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const getDoctorSlots = asyncHandler(async (req, res) => {
  const result = await slotService.getDoctorSlots({
    doctorId: req.query.doctorId,
    date: req.query.date,
  });

  return sendSuccess(res, {
    message: "Appointment slots retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

module.exports = {
  getDoctorSlots,
};
