import jwt from 'jsonwebtoken'

export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    console.warn('[auth] Missing token', { path: req.path, ip: req.ip })
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.googleId = decoded.googleId
    next()
  } catch (error) {
    console.warn('[auth] Invalid token', { path: req.path, ip: req.ip, reason: error.message })
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function generateToken(userId, googleId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set')
  return jwt.sign(
    { userId, googleId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )
}
