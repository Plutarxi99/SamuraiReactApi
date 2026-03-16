import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: 'http://localhost:3001' });

  // Validate all incoming DTOs; strip properties not in the DTO (whitelist)
  // NOTE: transform: true is required so that @Type(() => Number) in query
  // DTOs coerces the raw query-string strings to numbers before validation.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serialize responses through class-transformer — required for @Exclude() on passwordHash
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ---------------------------------------------------------------------------
  // OpenAPI / Swagger
  // ---------------------------------------------------------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Samurai Social API')
    .setDescription(
      'REST API for the Samurai social network. ' +
      'Authenticate via POST /api/auth/login, copy the returned `accessToken`, ' +
      'then click "Authorize" and enter: **Bearer <token>**.',
    )
    .setVersion('1.0')
    // NOTE: The security scheme name 'jwt' must match the name passed to
    // @ApiBearerAuth('jwt') on every protected controller / route.
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT token obtained from /api/auth/login',
      },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Swagger UI — available at /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    // NOTE: explorer:true enables the top search bar in Swagger UI.
    swaggerOptions: {
      persistAuthorization: true, // keeps the token across page refreshes
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Samurai API Docs',
  });

  // ReDoc — a read-only, more polished alternative view at /api/docs/redoc
  // NOTE: We serve ReDoc ourselves using a minimal HTML page that loads the
  // ReDoc CDN bundle and points it at our generated spec JSON endpoint.
  // This avoids an extra npm dependency (redoc, redoc-express) while still
  // giving consumers a clean, navigable reference.
  const redocHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Samurai API — ReDoc</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>body { margin: 0; padding: 0; }</style>
  </head>
  <body>
    <redoc spec-url='/api/docs-json'></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`;

  // Access the underlying Express instance to register the ReDoc route directly.
  // NOTE: We use the raw HTTP adapter because NestJS routing is not active yet
  // at bootstrap time; calling app.use() here is safe before app.listen().
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/docs/redoc', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(redocHtml);
  });
  // ---------------------------------------------------------------------------

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `Application running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger UI:             http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
  console.log(
    `ReDoc:                  http://localhost:${process.env.PORT ?? 3000}/api/docs/redoc`,
  );
  console.log(
    `OpenAPI JSON spec:      http://localhost:${process.env.PORT ?? 3000}/api/docs-json`,
  );
}
bootstrap();
