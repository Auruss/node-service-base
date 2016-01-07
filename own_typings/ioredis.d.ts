declare module "ioredis"
{
    module ioredis {
        interface ConnectConfig {
            port?: number;
            host?: string;
            familiy?: number;
            password?: string;
            db?: number;

            retryStrategy?: (times: number) => number;

            enableOfflineQueue?: boolean;
        }

        interface Promise<T> {
            then(success: (result: T) => void, failed: (reason) => void): Promise<T>;
        }

        interface ioredisStatic {
            // Constructors
            new(): ioredis;
            new(connectionString: string): ioredis;
            new(port: number): ioredis;
            new(port: number, host: string): ioredis;
            new(socket: string): ioredis;
            new(config: ConnectConfig): ioredis;

        }

        interface ioredis {
            // Default redis commands
            get(key: string): Promise<any>;
            set(key: string, value: string): Promise<void>;

            expire(key: string, ttl: number): Promise<void>;

            ttl(key: string): Promise<number>;

        }
    }

    var ioredis: ioredis.ioredisStatic;

    export = ioredis;
}