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

export const getDoctors = async (params = {}) => {
  try {
    const response = await apiClient.get('/doctors', { params })
    return unwrapList(response, 'doctors')
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

export const getPatients = async (params = {}) => {
  try {
    const response = await apiClient.get('/patients', { params })
    return unwrapList(response, 'patients')
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

export const getUsers = async (params = {}) => {
  try {
    const response = await apiClient.get('/users', { params })
    return unwrapList(response, 'users')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}
