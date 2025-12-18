import { Request, Response, NextFunction } from 'express';
interface JwtPayload {
    adminId: string;
    username: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
declare global {
    namespace Express {
        interface Request {
            admin?: JwtPayload;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorizeRoles: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const generateTokens: (admin: any) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyRefreshToken: (token: string) => {
    adminId: string;
};
export {};
//# sourceMappingURL=auth.d.ts.map