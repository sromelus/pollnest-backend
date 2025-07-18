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
    const authAccessToken = req.headers['authorization']?.split(' ')[1];
    const refreshToken = req.cookies?.['refreshToken'];
    const bothTokenValid = isValidTokenFormat(authAccessToken, refreshToken);

    if (!required) {
      try {
        if (bothTokenValid) {
          const { decoded, newAuthAccessToken, error } = await verifyAuthAccessToken(authAccessToken as string, refreshToken as string);



          if (decoded) {
            req.currentUserId = decoded.currentUserId;
            req.role = decoded.role;
            req.token = newAuthAccessToken;
          } else if (error && error.name === 'TokenExpiredError') {
            // Token expired and couldn't refresh
            // Set authAccessToken in res as a header
            res.setHeader('X-Token-Expired', 'true');
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
      if (!bothTokenValid) {
        res.status(401).json({
          success: false,
          message: 'No authentication token provided or refresh token expired'
        });
        return;
      }

      const { decoded, newAuthAccessToken, error } = await verifyAuthAccessToken(authAccessToken as string, refreshToken as string);

      if (error?.name === 'TokenMismatchError') {
        res.status(403).json({
          success: false,
          message: 'Invalid refreshToken'
        });
        return;
      }

      if (!decoded && !newAuthAccessToken) {
        res.status(401).json({
          success: false,
          message: 'Invalid authentication token'
        });
        return;
      }



      if (newAuthAccessToken) {
        //when the authAccessToken is expired,
        // set the updated authAccessToken in header to replace the expired one
        res.setHeader('auth-access-token', newAuthAccessToken);
      }

      if (!decoded || typeof decoded !== 'object') {
        res.status(401).json({
          success: false,
          message: 'Invalid token payload'
        });
        return;
      }

      req.currentUserId = decoded.currentUserId;
      req.role = decoded.role;
      req.token = newAuthAccessToken;

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

function isValidTokenFormat(authAccessToken: string | undefined, refreshToken: string | undefined) {
  // Check if either token is missing
  if (!authAccessToken || !refreshToken) {
    return false;
  }

  // Check token length and invalid content
  if (
    authAccessToken.length < 20 ||
    authAccessToken.includes('undefined') ||
    refreshToken.includes('undefined') ||
    refreshToken.includes('null')
  ) {
    return false;
  }

  return true;
}