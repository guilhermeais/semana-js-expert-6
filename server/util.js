import pino from 'pino';
const LOG_DISABLED = process.env.LOG_DISABLED === 'true';
const log = pino({
  enabled: !LOG_DISABLED,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    }
  }
})

export const logger = log