import * as dotenv from 'dotenv'
import Rascal, { BrokerAsPromised as Broker, BrokerConfig, SubscriberSessionAsPromised } from 'rascal'

dotenv.config()

const rascalConfig: BrokerConfig = Object.freeze({
  vhosts: {
    v1: {
      connection: { url: process.env.AMQP_URL },
      exchanges: {
        test_exchange: { type: 'direct', assert: true },
        my_dead_exchange: { assert: true },
        service_exchange: { assert: true },
      },
      queues: {
        test_queue: {
          options: {
            // arguments: {
            //   'x-dead-letter-exchange': 'my_dead_exchange',
            //   'x-dead-letter-routing-key': 'email.failed',
            // },
            deadLetterExchange: 'my_dead_exchange',
            deadLetterRoutingKey: 'email.failed',
          },
        },
        email_queue: {
          options: {
            deadLetterExchange: 'my_dead_exchange',
            deadLetterRoutingKey: 'deadLetter.email',
          },
        },
        log_queue: { assert: true },
        dead_letter_queue: { assert: true },
      },
      bindings: [
        'test_exchange[my_routing_key] -> test_queue',
        'service_exchange[service.order.email] -> email_queue',
        'service_exchange[service.#] -> log_queue',
        'my_dead_exchange[email.failed] -> dead_letter_queue',
        'my_dead_exchange[deadLetter.email] -> dead_letter_queue',
      ],
      publications: {
        demo_publication: {
          vhost: 'v1',
          exchange: 'test_exchange',
          routingKey: 'my_routing_key',
        },
        email_publication: {
          vhost: 'v1',
          exchange: 'service_exchange',
          routingKey: 'service.order.email',
        },
      },
      subscriptions: {
        demo_subscription: { queue: 'test_queue' },
        email_subscription: { queue: 'email_queue', prefetch: 2 },
      },
    },
  },
})

type BrokerReturn = [Broker | null, Error | null]
async function connectToBroker(config: BrokerConfig): Promise<BrokerReturn> {
  try {
    const broker = await Broker.create(config)
    return [broker, null]
  } catch (err) {
    return [null, err]
  }
}

async function rascal_produce() {
  console.info('Start connection to broker..')
  const config = Rascal.withDefaultConfig(rascalConfig)
  const [broker, err] = await connectToBroker(config)
  if (err) {
    throw new Error(`Broker config error: ${err.message}`)
  }
  broker.on('error', console.error)

  // const message = 'Hello from rascal library22 (publisher)'
  const message = { consignment: '711199' }
  const publication = await broker.publish('demo_publication', message)
  publication.on('error', console.error)

  console.log('Published successfully')
}

type SubscriberReturn = [SubscriberSessionAsPromised | null, Error | null]
async function subscribeToQueue(broker: Broker, queueName: string): Promise<SubscriberReturn> {
  try {
    const subscription = await broker.subscribe(queueName, { prefetch: 1 })
    return [subscription, null]
  } catch (err) {
    return [null, err]
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function rascal_consume() {
  console.info('Start connection to broker..')
  const config = Rascal.withDefaultConfig(rascalConfig)
  const [broker, err] = await connectToBroker(config)
  if (err) {
    throw new Error(`Broker config error: ${err.message}`)
  }

  broker.on('error', (err, myConfig) => {
    console.error('Broker error occurred', err, myConfig)
  })

  // const subscription = await broker.subscribe('demo_subscription')
  const [subscription, subErr] = await subscribeToQueue(broker, 'demo_subscription')
  if (subErr) {
    throw new Error(`Subscription didn't exist ${subErr.message}`)
  }
  console.info('[x] Waiting for messages..')

  subscription.on('message', async (message, content, ackOrNack) => {
    console.info('Received message:', JSON.stringify(message, null, 4))

    console.info('Message content:', content)

    await sleep(20000)

    console.info('🥶After sleep, ackOrNack')
    ackOrNack()

    // Cancel subscribe queue
    // subscription.cancel();
  })

  subscription.on('error', (err) => {
    console.error('Subscriber error', err)
  })

  subscription.on('invalid_content', (err, _message, ackOrNack) => {
    console.error('Failed to parse message', err)
    // ackOrNack(err, [{ strategy: 'republish', defer: 1000, attempts: 10 }, { strategy: 'nack' }]);
    ackOrNack(err, [{ strategy: 'republish', defer: 500, attempts: 3 }, { strategy: 'nack' }])
  })
}

rascal_produce().catch(console.error)
rascal_consume().catch(console.error)
