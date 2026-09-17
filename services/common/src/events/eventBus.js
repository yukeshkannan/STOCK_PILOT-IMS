const amqp = require('amqplib');
const { EventEmitter } = require('events');
const { logger } = require('../utils/logger');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.channel = null;
    this.exchange = 'stockpilot.events';
    this.isConnected = false;
    this.url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  }

  async connect() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      this.isConnected = true;
      logger.info('Connected to RabbitMQ Message Broker');

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Fallback to in-memory events.');
        this.isConnected = false;
      });
    } catch (err) {
      logger.warn(`RabbitMQ not reachable (${err.message}). Using In-Memory Event Bus fallback.`);
      this.isConnected = false;
    }
  }

  async publish(routingKey, data) {
    try {
      const message = Buffer.from(JSON.stringify(data));
      if (this.isConnected && this.channel) {
        this.channel.publish(this.exchange, routingKey, message, { persistent: true });
        logger.debug(`[EventBus] Published to RabbitMQ: ${routingKey}`);
      } else {
        this.emit(routingKey, data);
        logger.debug(`[EventBus] Emitted In-Memory: ${routingKey}`);
      }
    } catch (error) {
      logger.error(`Error publishing event ${routingKey}:`, error);
      this.emit(routingKey, data);
    }
  }

  async subscribe(pattern, queueName, handler) {
    try {
      if (this.isConnected && this.channel) {
        const q = await this.channel.assertQueue(queueName, { durable: true });
        await this.channel.bindQueue(q.queue, this.exchange, pattern);
        this.channel.consume(q.queue, async (msg) => {
          if (msg !== null) {
            try {
              const content = JSON.parse(msg.content.toString());
              await handler(content, msg.fields.routingKey);
              this.channel.ack(msg);
            } catch (err) {
              logger.error(`Error handling event on ${queueName}:`, err);
              this.channel.nack(msg, false, false);
            }
          }
        });
      } else {
        this.on(pattern, handler);
      }
    } catch (error) {
      logger.error(`Error subscribing to pattern ${pattern}:`, error);
      this.on(pattern, handler);
    }
  }
}

const eventBus = new EventBus();
module.exports = { eventBus };
