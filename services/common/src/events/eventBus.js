const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const amqp = require('amqplib');
const { logger } = require('../utils/logger');

class EventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = 'stockpilot.events';
    this.isConnected = false;
    this.isConnecting = false;
    this.url = process.env.RABBITMQ_URL;
    this.subscriptions = [];
  }

  async connect() {
    if (this.isConnected || this.isConnecting) return;
    this.url = process.env.RABBITMQ_URL;

    if (!this.url) {
      logger.warn('[RabbitMQ] RABBITMQ_URL is not set in .env. Skipping broker connection.');
      return;
    }

    this.isConnecting = true;

    try {
      const brokerHost = this.url.includes('@') ? this.url.split('@')[1] : this.url;
      logger.info(`[RabbitMQ] Connecting to Cloud Message Broker: ${brokerHost}`);
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      this.isConnected = true;
      this.isConnecting = false;
      logger.info('[RabbitMQ] Successfully connected to CloudAMQP Broker & Exchange initialized');

      // Re-bind previous subscriptions upon reconnect
      if (this.subscriptions.length > 0) {
        for (const sub of this.subscriptions) {
          await this._bindSubscription(sub.pattern, sub.queueName, sub.handler);
        }
      }

      this.connection.on('error', (err) => {
        logger.error('[RabbitMQ] Connection error:', err.message);
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnect();
      });

      this.connection.on('close', () => {
        logger.warn('[RabbitMQ] Connection closed. Attempting reconnect...');
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnect();
      });
    } catch (err) {
      this.isConnected = false;
      this.isConnecting = false;
      logger.error(`[RabbitMQ] Failed to connect (${err.message}). Retrying in 5s...`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  reconnect() {
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, 5000);
  }

  async publish(routingKey, data) {
    try {
      if (!this.isConnected || !this.channel) {
        logger.warn(`[RabbitMQ] Channel not ready. Attempting immediate connect before publishing ${routingKey}...`);
        await this.connect();
      }

      if (this.channel) {
        const message = Buffer.from(JSON.stringify(data));
        this.channel.publish(this.exchange, routingKey, message, { persistent: true });
        logger.info(`[RabbitMQ] Published event: ${routingKey}`);
        return true;
      } else {
        throw new Error('RabbitMQ channel unavailable');
      }
    } catch (error) {
      logger.error(`[RabbitMQ Error] Failed to publish ${routingKey}:`, error.message);
      throw error;
    }
  }

  async subscribe(pattern, queueName, handler) {
    this.subscriptions.push({ pattern, queueName, handler });
    if (this.isConnected && this.channel) {
      await this._bindSubscription(pattern, queueName, handler);
    }
  }

  async _bindSubscription(pattern, queueName, handler) {
    try {
      const q = await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.bindQueue(q.queue, this.exchange, pattern);
      this.channel.consume(q.queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content, msg.fields.routingKey);
            this.channel.ack(msg);
          } catch (err) {
            logger.error(`[RabbitMQ] Error processing message in ${queueName}:`, err.message);
            this.channel.nack(msg, false, false);
          }
        }
      });
      logger.info(`[RabbitMQ] Subscribed queue [${queueName}] to pattern [${pattern}]`);
    } catch (error) {
      logger.error(`[RabbitMQ] Failed to bind subscription [${pattern}] to queue [${queueName}]:`, error.message);
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      broker: this.url ? (this.url.includes('@') ? this.url.split('@')[1] : this.url) : 'not_configured',
      exchange: this.exchange,
      activeSubscriptions: this.subscriptions.length
    };
  }
}

const eventBus = new EventBus();
module.exports = { eventBus };
