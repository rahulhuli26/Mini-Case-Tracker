import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Express middleware that authenticates a request using a `Bearer` JWT from
 * the `Authorization` header. On success, attaches the authenticated user
 * (password excluded) to `req.user`; otherwise responds with 401.
 *
 * @param {import('express').Request} req - Incoming request.
 * @param {import('express').Response} res - Outgoing response.
 * @param {import('express').NextFunction} next - Next middleware in the chain.
 * @returns {Promise<void>}
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Express middleware factory that restricts a route to the given role(s).
 * Must run after {@link protect} so `req.user` is populated.
 *
 * @param {...string} roles - Role names allowed to access the route (e.g. `'Manager'`, `'Agent'`).
 * @returns {import('express').RequestHandler} Middleware that responds with 403 if the user's role is not included.
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  next();
};
