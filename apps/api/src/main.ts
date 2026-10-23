import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { ConfigError, loadConfig } from './platform/config/load-config.js';
import { appOptions, configureApp } from './platform/http/configure-app.js';

async function bootstrap() {
  const config = loadConfig(process.env);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.forRoot(config),
    appOptions,
  );

  configureApp(app);
  await app.listen(config.port);
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof ConfigError ? error.message : error);
  process.exit(1);
});
