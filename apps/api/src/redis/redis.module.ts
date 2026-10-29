import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: Redis,
      useFactory: () => {
        const url = process.env.REDIS_URL ?? '';

        if (
          process.env.NODE_ENV === 'production' &&
          !url.startsWith('rediss:')
        ) {
          throw new Error('REDIS_URL must use TLS (rediss:) in production');
        }

        return new Redis(url);
      },
    },
  ],
  exports: [Redis],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
