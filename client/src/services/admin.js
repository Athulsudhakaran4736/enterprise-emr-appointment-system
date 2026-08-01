import { apiClient } from './api.js'

const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  return 'Unable to load data right now. Please try again.'
}

const unwrapList = (response, key) => ({
  items: response.data?.data?.[key] ?? [],
  meta: response.data?.meta ?? {},
})

export const getDepartments = async (params = {}) => {
  try {
    const response = await apiClient.get('/departments', { params })
    return unwrapList(response, 'departments')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const createDepartment = async (payload) => {
  try {
    const response = await apiClient.post('/departments', payload)
    return response.data?.data?.department ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const updateDepartment = async (departmentId, payload) => {
  try {
    const response = await apiClient.put(`/departments/${departmentId}`, payload)
    return response.data?.data?.department ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getDoctors = async (params = {}) => {
  try {
    const response = await apiClient.get('/doctors', { params })
    return unwrapList(response, 'doctors')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getDoctorById = async (doctorId) => {
  try {
    const response = await apiClient.get(`/doctors/${doctorId}`)
    return response.data?.data?.doctor ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const createDoctor = async (payload) => {
  try {
    const response = await apiClient.post('/doctors', payload)
    return response.data?.data?.doctor ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const updateDoctor = async (doctorId, payload) => {
  try {
    const response = await apiClient.put(`/doctors/${doctorId}`, payload)
    return response.data?.data?.doctor ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getDoctorSchedules = async (doctorId, params = {}) => {
  try {
    const response = await apiClient.get(`/schedules/doctor/${doctorId}`, { params })
    return unwrapList(response, 'schedules')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const createSchedule = async (payload) => {
  try {
    const response = await apiClient.post('/schedules', payload)
    return response.data?.data?.schedule ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const updateSchedule = async (scheduleId, payload) => {
  try {
    const response = await apiClient.put(`/schedules/${scheduleId}`, payload)
    return response.data?.data?.schedule ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getDoctorSlots = async (params = {}) => {
  try {
    const response = await apiClient.get('/slots', { params })
    return {
      data: response.data?.data ?? {},
      meta: response.data?.meta ?? {},
    }
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getPatients = async (params = {}) => {
  try {
    const response = await apiClient.get('/patients', { params })
    return unwrapList(response, 'patients')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const createPatient = async (payload) => {
  try {
    const response = await apiClient.post('/patients', payload)
    return response.data?.data?.patient ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const updatePatient = async (patientId, payload) => {
  try {
    const response = await apiClient.put(`/patients/${patientId}`, payload)
    return response.data?.data?.patient ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getAppointments = async (params = {}) => {
  try {
    const response = await apiClient.get('/appointments', { params })
    return unwrapList(response, 'appointments')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getAppointmentById = async (appointmentId) => {
  try {
    const response = await apiClient.get(`/appointments/${appointmentId}`)
    return response.data?.data?.appointment ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const createAppointment = async (payload) => {
  try {
    const response = await apiClient.post('/appointments', payload)
    return response.data?.data?.appointment ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const updateAppointment = async (appointmentId, payload) => {
  try {
    const response = await apiClient.put(`/appointments/${appointmentId}`, payload)
    return response.data?.data?.appointment ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const markPatientArrived = async (appointmentId) => {
  try {
    const response = await apiClient.post(`/appointments/${appointmentId}/arrive`)
    return response.data?.data?.appointment ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const completeAppointment = async (appointmentId) => {
  try {
    const response = await apiClient.post(`/appointments/${appointmentId}/complete`)
    return response.data?.data?.appointment ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const cancelAppointment = async (appointmentId, cancellationReason) => {
  try {
    const response = await apiClient.delete(`/appointments/${appointmentId}`, {
      data: { cancellationReason },
    })
    return response.data?.data?.appointment ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const getUsers = async (params = {}) => {
  try {
    const response = await apiClient.get('/users', { params })
    return unwrapList(response, 'users')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const createReceptionist = async (payload) => {
  try {
    const response = await apiClient.post('/users/receptionists', payload)
    return response.data?.data?.user ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
