import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, Message } from 'amqplib';
import { setTimeout } from 'node:timers/promises';
import type { UserRegistered } from '../queue/email.queue.js';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  @EventPattern<string>('user.registered')
  async handle(@Payload() data: UserRegistered, @Ctx() ctx: RmqContext) {
    const channel = ctx.getChannelRef() as Channel;
    const message = ctx.getMessage() as Message;
    // Set EMAIL_DELAY_MS=5000 to see Unacked in the UI and to kill the worker mid-send
    await setTimeout(Number(process.env.EMAIL_DELAY_MS ?? 0));
    // shortcut: logs instead of sending and has no retry; a real mailer needs a retry queue + DLQ
    this.logger.log(
      `Welcome email to ${data.email} (message ${data.messageId}, redelivered: ${message.fields.redelivered})`,
    );
    // Only now is it deleted. Crash before this line and RabbitMQ redelivers it.
    channel.ack(message);
  }
}
