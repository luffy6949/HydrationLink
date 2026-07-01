import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';

export interface AuthedRequest extends Request {
  user?: IUser;
}

/**
 * "Zero-login" auth: the client stores a deviceToken (issued at role-claim
 * time) in react-native-keychain and sends it as a Bearer token on every
 * request. We look up which of the two seeded users it belongs to.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }
  const deviceToken = header.slice('Bearer '.length);
  const user = await User.findOne({ deviceToken });
  if (!user) {
    res.status(401).json({ error: 'Invalid device token' });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(role: 'SENDER' | 'RECEIVER') {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: `This action requires the ${role} role` });
      return;
    }
    next();
  };
}
