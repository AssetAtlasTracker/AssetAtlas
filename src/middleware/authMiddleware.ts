import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export interface UserPayload {
  id: string;
  username: string;
  permissionLevel: number;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    
    // Attach user info to request
    (req as AuthRequest).user = decoded;
    
    // Continue to next middleware or route handler
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('Authentication error:', err);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware for permission-based access control
export const requirePermission = (minimumLevel: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (authReq.user.permissionLevel < minimumLevel) {
      return res.status(403).json({ 
        message: `Insufficient permissions` 
      });
    }
    
    next();
  };
};
