// Must be first, so every other file sees the .env values
import '../load-env.js';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  EMAIL_QUEUE,
  EMAIL_QUEUE_OPTIONS,
  rmqUrl,
} from '../queue/email.queue.js';
import { WorkerModule } from './worker.module.js';

// A separate process from the API: it only reads email_queue
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  WorkerModule,
  {
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl()],
      queue: EMAIL_QUEUE,
      queueOptions: EMAIL_QUEUE_OPTIONS,
      noAck: false, // we ack by hand, after the work
      prefetchCount: 5, // at most 5 un-acked per worker
    },
  },
);
await app.listen();
