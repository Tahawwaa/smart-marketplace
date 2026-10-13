import { api, tokenStore } from '../../lib/api/client'
import type { ApiItem, AuthResponse, User } from '../../types/api'

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  role?: 'customer' | 'vendor'
}

export async function login(input: LoginInput, signal?: AbortSignal) {
  const response = await api<AuthResponse>('/auth/login', { method: 'POST', body: input, signal })
  tokenStore.set(response.token)
  return response
}

export async function register(input: RegisterInput, signal?: AbortSignal) {
  const response = await api<AuthResponse>('/auth/register', { method: 'POST', body: input, signal })
  tokenStore.set(response.token)
  return response
}

export const fetchMe = async (signal?: AbortSignal) =>
  (await api<ApiItem<User>>('/auth/me', { signal })).data

export async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' })
  } finally {
    tokenStore.clear()
  }
}

export type ProfileInput = {
  name?: string
  phone?: string | null
}

export const updateProfile = (input: ProfileInput) =>
  api<ApiItem<User>>('/auth/profile', { method: 'PUT', body: input })

export type PasswordInput = {
  current_password: string
  password: string
  password_confirmation: string
}

export const updatePassword = (input: PasswordInput) =>
  api<{ message: string }>('/auth/password', { method: 'PUT', body: input })
