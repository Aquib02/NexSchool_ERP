export const logger = {
  info: (msg, meta = '') => {
    console.log(`[${new Date().toISOString()}] [INFO]: ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`[${new Date().toISOString()}] [WARN]: ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  error: (msg, meta = '') => {
    console.error(`[${new Date().toISOString()}] [ERROR]: ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (msg, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG]: ${msg}`, meta ? JSON.stringify(meta) : '');
    }
  },
};

export default logger;
