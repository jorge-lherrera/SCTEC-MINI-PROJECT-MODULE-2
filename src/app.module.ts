import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/data-source';
import { UserRole } from './entities/user-role.enum';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { requireRoles } from './middlewares/role.middleware';
import { AdminModule } from './modules/admin.module';
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UserModule,
    AuthModule,
    AdminModule,
  ],
  providers: [AuthMiddleware],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes('users', 'admin');
    consumer.apply(requireRoles(UserRole.ADMINISTRADOR)).forRoutes('admin');
  }
}
