import axios from 'axios'
import { STORAGE_KEYS } from '../constants/auth.js'

export const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(
    /\/$/,
    '',
  )

export const clearStoredSession = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
}

export const getStoredToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

export const getStoredUser = () => {
  const rawUser = localStorage.getItem(STORAGE_KEYS.USER)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    clearStoredSession()
    return null
  }
}

export const storeSession = ({ accessToken, user }) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession()
      window.location.replace('/login')
    }

    return Promise.reject(error)
  },
)
