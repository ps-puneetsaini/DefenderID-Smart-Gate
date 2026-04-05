import API from './authService'

export const getGateStatus = () => API.get('/gate/status')
export const openGate = (payload) => API.post('/gate/open', payload)
export const closeGate = () => API.post('/gate/close')

export const verifyCard = (cardNumber) =>
  API.get(`/verify/card/${cardNumber}`)

export const getAccessLogs = (page = 1) =>
  API.get(`/verify/logs?page=${page}&limit=50`)
