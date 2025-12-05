export declare const config: {
    readonly port: number;
    readonly nodeEnv: string;
    readonly apiPrefix: string;
    readonly database: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly database: string;
        readonly ssl: false | {
            rejectUnauthorized: boolean;
        };
        readonly max: number;
        readonly idleTimeoutMillis: number;
        readonly connectionTimeoutMillis: number;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
        readonly refreshSecret: string;
        readonly refreshExpiresIn: string;
    };
    readonly security: {
        readonly saltRounds: number;
        readonly maxLoginAttempts: number;
        readonly lockoutDuration: number;
        readonly pepperKey: string;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
        readonly verificationWindowMs: number;
        readonly verificationMaxRequests: number;
    };
    readonly cors: {
        readonly origin: string;
    };
    readonly upload: {
        readonly maxFileSize: number;
        readonly uploadPath: string;
    };
    readonly logging: {
        readonly level: string;
        readonly dir: string;
    };
    readonly csl: {
        readonly pepperKey: string;
        readonly hashLength: 6;
        readonly yearDigits: 4;
        readonly courseCodeLength: 2;
        readonly sequentialDigits: 4;
    };
};
export declare const validateConfig: () => void;
//# sourceMappingURL=index.d.ts.map