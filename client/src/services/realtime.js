import { io } from 'socket.io-client'
import { apiBaseUrl, getStoredToken } from './api.js'

const SOCKET_EVENT_APPOINTMENTS_CHANGED = 'appointments:changed'

const socketBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '')

let socket = null
let appointmentSubscriptionCount = 0

const createSocketClient = () =>
  io(socketBaseUrl, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: (callback) => {
      callback({ token: getStoredToken() })
    },
  })

const getSocketClient = () => {
  if (!socket) {
    socket = createSocketClient()
  }

  return socket
}

export const subscribeToAppointmentChanges = (callback) => {
  if (typeof callback !== 'function' || !getStoredToken()) {
    return () => {}
  }

  const client = getSocketClient()
  const handleAppointmentChange = (event) => {
    callback(event)
  }

  appointmentSubscriptionCount += 1
  client.on(SOCKET_EVENT_APPOINTMENTS_CHANGED, handleAppointmentChange)

  if (!client.connected) {
    client.connect()
  }

  return () => {
    client.off(SOCKET_EVENT_APPOINTMENTS_CHANGED, handleAppointmentChange)
    appointmentSubscriptionCount = Math.max(0, appointmentSubscriptionCount - 1)

    if (appointmentSubscriptionCount === 0) {
      client.disconnect()
    }
  }
}
