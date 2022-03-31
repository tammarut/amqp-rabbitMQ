import './rascal'
// import * as dotenv from 'dotenv'
// import {
//   connect,
//   Connection,
//   Message,
//   Channel,
//   ConfirmChannel,
// } from 'amqplib/callback_api'

// dotenv.config()

// const TASKS_QUEUE = process.env.TASKS_QUEUE
// const AMQP_URL = process.env.AMQP_URL

// type MessageType = [string, string, Buffer]
// const internalPubQueue: MessageType[] = []

// let pubChannel: ConfirmChannel
// //  publish a message, will queue messages internally if the connection is down and resend later
// const publish = (exchange: string, routingKey: string, content: Buffer) => {
//   try {
//     pubChannel.publish(
//       exchange,
//       routingKey,
//       content,
//       { persistent: true },
//       (err, _ok) => {
//         if (err) {
//           console.error('[AMQP] error occurrd when publish', err)
//           internalPubQueue.push([exchange, routingKey, content])
//         }
//       },
//     )
//   } catch (err) {
//     console.error('[AMQP] error occurrd when publish', err.message)
//     internalPubQueue.push([exchange, routingKey, content])
//   }
// }

// function publisher(connection: Connection) {
//   connection.createConfirmChannel((err, channel) => {
//     if (err != null) {
//       console.error('[AMQP] error', err)
//       connection.close()
//       process.exit(1)
//     }

//     channel.on('error', (err) => {
//       console.error('❌AMQP channel error:', err.message)
//     })
//     channel.on('close', () => {
//       console.info('🔥AMQP channel closed')
//     })

//     pubChannel = channel
//     const forever = true
//     while (forever) {
//       const message = internalPubQueue.shift()
//       if (!message) break
//       const [exchange, routingKey, content] = message
//       publish(exchange, routingKey, content)
//     }
//   })
// }

// let amqpConnection: Connection
// let onMessageChannel: Channel
// function work(msg: Message, callback: any) {
//   console.info('PDF processing of ', msg.content.toString())
//   callback(true)
// }

// function onMessage(msg: Message | null) {
//   if (!msg) return
//   work(msg, (ok: boolean) => {
//     try {
//       if (!ok) onMessageChannel.reject(msg, true)
//       onMessageChannel.ack(msg)
//     } catch (err) {
//       console.error('[AMQP: onMessage] error occurrd', err)
//       amqpConnection.close()
//     }
//   })
// }

// // A subscriber that acks messages only if processed successfully
// function subscriber(connection: Connection) {
//   connection.createChannel((err, channel) => {
//     if (err != null) {
//       console.error('[AMQP] error', err)
//       connection.close()
//       process.exit(1)
//     }

//     channel.on('error', (err) => {
//       console.error('❌AMQP channel error:', err.message)
//     })
//     channel.on('close', () => {
//       console.info('🔒AMQP channel closed')
//     })

//     channel.prefetch(2)
//     channel.assertQueue(TASKS_QUEUE, { durable: true }, (err, ok) => {
//       if (err) {
//         console.error('[AMQP] error occurrd when assertQueue', err)
//         connection.close()
//         return
//       }
//       console.info('🍎consumer ok:', ok)

//       onMessageChannel = channel
//       channel.consume(TASKS_QUEUE, onMessage)
//       console.info('subscriber is started')
//     })
//   })
// }

// function initializeAMQP(amqpUrl: string) {
//   connect(amqpUrl, (err, connection) => {
//     if (err != null) {
//       console.error('initialize AMQP', err.message)
//       return setTimeout(initializeAMQP, 1000)
//     }

//     connection.on('error', (err) => {
//       if (err.message !== 'Connection closing') {
//         console.error('initialize AMQP', err.message)
//       }
//     })

//     connection.on('close', () => {
//       console.error('re-connection AMQP')
//       return setTimeout(initializeAMQP, 1000)
//     })

//     console.info('AMQP connected successfully')

//     publisher(connection)
//     subscriber(connection)
//     amqpConnection = connection
//     return connection
//   })
// }

// initializeAMQP(AMQP_URL)
// setInterval(() => {
//   publish('', TASKS_QUEUE, Buffer.from('publishing first message'))
// }, 1700)

