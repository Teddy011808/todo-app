// Shared by the API (producer) and the worker (consumer). RabbitMQ refuses a
// queue declared with different options, so both must use this same object.
export const EMAIL_QUEUE = 'email_queue';
export const EMAIL_QUEUE_OPTIONS = { durable: true };

export const rmqUrl = () => process.env.RMQ_URL ?? 'amqp://localhost:5672';

export interface UserRegistered {
  messageId: string;
  userId: number;
  email: string;
}
