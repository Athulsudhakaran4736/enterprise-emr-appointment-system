export const appointmentStatusColors = {
  SCHEDULED: 'blue',
  ARRIVED: 'gold',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

export const weekdayLabels = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const formatStatusLabel = (value) =>
  value
    ?.toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown'

export const formatTimeRange = (startTime, endTime) => `${startTime} - ${endTime}`

export const getScheduleSummary = (workingDays = []) =>
  workingDays.filter((day) => day.isWorking).map((day) => ({
    ...day,
    label: weekdayLabels[day.dayOfWeek] || `Day ${day.dayOfWeek}`,
  }))
