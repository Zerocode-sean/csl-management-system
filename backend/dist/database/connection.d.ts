import { Pool, PoolClient } from 'pg';
export declare const connectDatabase: () => Promise<void>;
export declare const closeDatabase: () => Promise<void>;
export declare const getPool: () => Pool;
export declare const query: (text: string, params?: any[]) => Promise<any>;
export declare const getClient: () => Promise<PoolClient>;
//# sourceMappingURL=connection.d.ts.map