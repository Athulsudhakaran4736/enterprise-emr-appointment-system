import {
  getAppointmentById,
  getAppointments,
  getDoctorById,
  getDoctors,
  getDoctorSchedules,
} from './admin.js'

const findMatchingDoctor = (items, user) =>
  items.find((doctor) => {
    const doctorUserId = doctor.user?.id || doctor.user?._id
    return doctorUserId === user.id
  })

export const getMyDoctorProfile = async (user) => {
  if (!user?.id) {
    throw new Error('Unable to resolve the current doctor profile.')
  }

  const searchTerms = [user.email, user.name].filter(Boolean)

  for (const search of searchTerms) {
    const result = await getDoctors({ page: 1, limit: 50, search })
    const match = findMatchingDoctor(result.items, user)

    if (match) {
      return getDoctorById(match.id || match._id)
    }
  }

  const fallback = await getDoctors({ page: 1, limit: 500 })
  const match = findMatchingDoctor(fallback.items, user)

  if (!match) {
    throw new Error('Doctor profile not found for the current account.')
  }

  return getDoctorById(match.id || match._id)
}

export const getMyDoctorSchedules = async (user, params = {}) => {
  const doctor = await getMyDoctorProfile(user)
  const schedules = await getDoctorSchedules(doctor.id || doctor._id, params)

  return {
    doctor,
    ...schedules,
  }
}

export const getMyAppointments = async (params = {}) => getAppointments(params)

export const getMyAppointmentById = async (appointmentId) => getAppointmentById(appointmentId)
