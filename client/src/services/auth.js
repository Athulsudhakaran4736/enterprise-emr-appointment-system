import {
  apiClient,
  apiBaseUrl,
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  storeSession,
} from './api.js'

const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  return 'Unable to complete the request right now. Check your connection and try again.'
}

export const getSession = () => {
  const accessToken = getStoredToken()
  const user = getStoredUser()

  if (!accessToken || !user) {
    return null
  }

  return { accessToken, user }
}

export const loginUser = async ({ email, password }) => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    })

    const authData = response.data?.data ?? null

    if (!authData?.user || !authData?.accessToken) {
      throw new Error('Authentication response is incomplete.')
    }

    storeSession(authData)
    return authData
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // Clear client state even if the server logout request fails.
  } finally {
    clearStoredSession()
  }
}

export const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me')
    return response.data?.data?.user ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export { apiBaseUrl, clearStoredSession }
