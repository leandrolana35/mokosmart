import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
const TOKEN_TTL = '12h'

/** Sem JWT_SECRET/ADMIN_USERNAME/ADMIN_PASSWORD_HASH configurados, a API roda aberta (modo dev). */
export function isAuthConfigured(): boolean {
  return Boolean(JWT_SECRET && ADMIN_USERNAME && ADMIN_PASSWORD_HASH)
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) return false
  if (username !== ADMIN_USERNAME) return false
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH)
}

export function issueToken(username: string): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado.')
  return jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

export function verifyToken(token: string): boolean {
  if (!JWT_SECRET) return false
  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthConfigured()) {
    next()
    return
  }

  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Não autenticado.' })
    return
  }

  try {
    jwt.verify(token, JWT_SECRET as string)
    next()
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' })
  }
}

const GATEWAY_INGEST_TOKEN = process.env.GATEWAY_INGEST_TOKEN

/** Protege o endpoint de ingestão dos Gateways com um token compartilhado simples (não é JWT de usuário). */
export function requireGatewayToken(req: Request, res: Response, next: NextFunction): void {
  if (!GATEWAY_INGEST_TOKEN) {
    next()
    return
  }

  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (token !== GATEWAY_INGEST_TOKEN) {
    res.status(401).json({ error: 'Token de ingestão inválido.' })
    return
  }

  next()
}
