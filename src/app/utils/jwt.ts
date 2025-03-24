import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export interface JWTPayload extends jose.JWTPayload {
  userId: number
  email: string
}

export const generateToken = async (payload: JWTPayload, expiresIn: number): Promise<string> => {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}

export const verifyToken = async (token: string): Promise<JWTPayload> => {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    throw new Error('Invalid token')
  }
}