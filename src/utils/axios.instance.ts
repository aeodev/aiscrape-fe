import axios from 'axios'
import { BASE_URL } from '@/utils/api.routes'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const sessionId = sessionStorage.getItem('sessionId')
  if (sessionId) {
    config.headers = config.headers ?? {}
    config.headers['x-session-id'] = sessionId
  }

  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  config.headers = config.headers ?? {}
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }

  return config
})

export default axiosInstance

