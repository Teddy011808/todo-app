import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EMAIL_QUEUE,
  EMAIL_QUEUE_OPTIONS,
  rmqUrl,
} from '../queue/email.queue.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RefreshToken } from './refresh-token.entity.js';
import { User } from './user.entity.js';

@Module({
  imports: [
    PassportModule,
    ClientsModule.registerAsync([
      {
        name: 'EMAIL_SERVICE',
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [rmqUrl()],
            queue: EMAIL_QUEUE,
            queueOptions: EMAIL_QUEUE_OPTIONS,
            persistent: true, // default is false: messages would die with the broker
          },
        }),
      },
    ]),
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
