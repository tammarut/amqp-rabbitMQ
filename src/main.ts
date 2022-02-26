import * as dotenv from 'dotenv'
import { connect, Connection } from 'amqplib/callback_api'

dotenv.config()
const TASKS_QUEUE = process.env.TASKS_QUEUE
const AMQP_URL = process.env.AMQP_URL

function publisher(connection: Connection) {
  connection.createChannel((err, channel) => {
    if (err != null) {
      console.error(err)
      process.exit(1)
    }

    channel.assertQueue(TASKS_QUEUE)
    channel.sendToQueue(TASKS_QUEUE, Buffer.from('Hello message'))
  })
}

function initializeAMQP() {
  connect(AMQP_URL, (err, connection) => {
    if (err != null) {
      console.error('initialize AMQP', err.message)
      return setTimeout(initializeAMQP, 1000)
    }

    connection.on('error', (err) => {
      if (err.message !== 'Connection closing') {
        console.error('initialize AMQP', err.message)
      }
    })

    connection.on('close', () => {
      console.error('re-connection AMQP')
      return setTimeout(initializeAMQP, 1000)
    })

    console.info('AMQP connected successfully')

    publisher(connection)
    return connection
  })
}

initializeAMQP()
