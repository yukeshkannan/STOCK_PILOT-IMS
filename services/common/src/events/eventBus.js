const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const amqp = require('amqplib');
const { logger } = require('../utils/logger');

class EventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = 'stockpilot.events';
    this.dlxExchange = 'stockpilot.dlx';
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
      
      // Initialize primary business event exchange and Dead-Letter Exchange (DLX)
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      await this.channel.assertExchange(this.dlxExchange, 'topic', { durable: true });
      
      this.isConnected = true;
      this.isConnecting = false;
      logger.info('[RabbitMQ] Connected: Primary Exchange [stockpilot.events] & DLX [stockpilot.dlx] active');

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

  async publish(routingKey, data, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        logger.warn(`[RabbitMQ] Channel not ready. Attempting immediate connect before publishing ${routingKey}...`);
        await this.connect();
      }

      if (this.channel) {
        const message = Buffer.from(JSON.stringify(data));
        this.channel.publish(this.exchange, routingKey, message, {
          persistent: true,
          headers: {
            'x-published-at': new Date().toISOString(),
            ...(options.headers || {})
          },
          ...options
        });
        logger.info(`[RabbitMQ] Published event: ${routingKey}`);
        return true;
      } else {
        logger.warn(`[RabbitMQ] Channel unavailable, skipped event: ${routingKey}`);
        return false;
      }
    } catch (error) {
      logger.warn(`[RabbitMQ Warning] Failed to publish ${routingKey}: ${error.message}`);
      return false;
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
      const dlqQueueName = `${queueName}.dlq`;

      // 1. Assert Dead-Letter Queue bound to DLX for capturing unprocessable poison messages
      await this.channel.assertQueue(dlqQueueName, { durable: true });
      await this.channel.bindQueue(dlqQueueName, this.dlxExchange, `${queueName}.dead`);

      // 2. Assert Primary Queue with dead-letter exchange configuration
      const q = await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': this.dlxExchange,
          'x-dead-letter-routing-key': `${queueName}.dead`
        }
      });

      await this.channel.bindQueue(q.queue, this.exchange, pattern);

      // 3. Resilient consumer with automatic 3x retry before dead-lettering
      this.channel.consume(q.queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content, msg.fields.routingKey);
            this.channel.ack(msg);
          } catch (err) {
            const retryCount = (msg.properties.headers && msg.properties.headers['x-retry-count']) || 0;
            logger.error(`[RabbitMQ] Error in ${queueName} (attempt ${retryCount + 1}/3): ${err.message}`);

            if (retryCount < 3) {
              const updatedHeaders = {
                ...(msg.properties.headers || {}),
                'x-retry-count': retryCount + 1,
                'x-last-error': err.message,
                'x-retry-timestamp': new Date().toISOString()
              };

              // Re-queue message with exponential backoff delay (1.5s, 3s, 4.5s)
              setTimeout(() => {
                if (this.channel) {
                  this.channel.sendToQueue(q.queue, msg.content, {
                    headers: updatedHeaders,
                    persistent: true
                  });
                  this.channel.ack(msg);
                }
              }, (retryCount + 1) * 1500);
            } else {
              // Max retries exhausted: Reject without requeue -> automatically routed to DLX -> dlqQueueName
              logger.warn(`[RabbitMQ DLQ] Max retries exhausted for message in [${queueName}]. Shunted to Dead-Letter Queue [${dlqQueueName}]`);
              this.channel.nack(msg, false, false);
            }
          }
        }
      });

      logger.info(`[RabbitMQ] Subscribed queue [${queueName}] (DLQ: [${dlqQueueName}]) to pattern [${pattern}]`);
    } catch (error) {
      logger.error(`[RabbitMQ] Failed to bind subscription [${pattern}] to queue [${queueName}]:`, error.message);
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      broker: this.url ? (this.url.includes('@') ? this.url.split('@')[1] : this.url) : 'not_configured',
      exchange: this.exchange,
      dlxExchange: this.dlxExchange,
      activeSubscriptions: this.subscriptions.length
    };
  }
}

const eventBus = new EventBus();
module.exports = { eventBus };
