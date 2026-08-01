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

const redirectToLogin = () => {
  clearStoredSession()

  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

const isAuthEndpoint = (config, path) => config?.url?.includes(path)

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

let refreshPromise = null

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh')
      .then((response) => {
        const authData = response.data?.data ?? null

        if (!authData?.user || !authData?.accessToken) {
          throw new Error('Authentication response is incomplete.')
        }

        storeSession(authData)
        return authData.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
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
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    if (
      isAuthEndpoint(originalRequest, '/auth/login') ||
      isAuthEndpoint(originalRequest, '/auth/refresh')
    ) {
      redirectToLogin()
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      redirectToLogin()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const nextAccessToken = await refreshAccessToken()
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      redirectToLogin()
      return Promise.reject(refreshError)
    }
  },
)
