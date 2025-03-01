import { Request, Response, NextFunction } from "express";
import { verifyAuthAccessToken } from "../utils";

// Define custom interface to extend Express Request
interface AuthenticatedRequest extends Request {
  currentUserId?: string | null;
  role?: string | null;
  token?: string | null;
}

// Define auth options interface
interface AuthOptions {
  required?: boolean;
}

export const auth = ({ required = true }: AuthOptions = {}) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const refreshToken = req.cookies?.['refresh-token'];

    if (!required) {
      try {
        if (token) {
          const { decoded, newAuthAccessToken } = await verifyAuthAccessToken(token, refreshToken);
          if (decoded) {
            req.currentUserId = decoded.currentUserId;
            req.role = decoded.role;
            req.token = newAuthAccessToken;
          }
        }
        // Set defaults if no token or verification fails
        req.currentUserId ??= null;
        req.role ??= null;
        req.token ??= null;
        next();
        return;
      } catch (error) {
        // Handle optional auth failure gracefully
        req.currentUserId = null;
        req.role = null;
        req.token = null;
        next();
        return;
      }
    }

    try {
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'No authentication token provided'
        });
        return;
      }

      const { decoded: decoded2, newAuthAccessToken: newAuthAccessToken2 } = await verifyAuthAccessToken(token, refreshToken);

      if (!decoded2 && !newAuthAccessToken2) {
        res.status(401).json({
          success: false,
          message: 'Invalid authentication token'
        });
        return;
      }

      if (newAuthAccessToken2) {
        res.setHeader('New-Token', newAuthAccessToken2);
      }

      if (!decoded2 || typeof decoded2 !== 'object') {
        res.status(401).json({
          success: false,
          message: 'Invalid token payload'
        });
        return;
      }

      req.currentUserId = decoded2.currentUserId;
      req.role = decoded2.role;
      req.token = token;

      next();
      return;
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  };
};