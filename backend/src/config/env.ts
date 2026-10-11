import dotenv from 'dotenv';
dotenv.config();

export const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/apiflow',
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  maxRequestTimeoutMs: parseInt(process.env.MAX_REQUEST_TIMEOUT_MS || '30000', 10),
  maxResponseSizeBytes: parseInt(process.env.MAX_RESPONSE_SIZE_BYTES || '5242880', 10),
  maxConcurrentExecutions: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '5', 10),
  maxWorkflowNodes: parseInt(process.env.MAX_WORKFLOW_NODES || '50', 10),
  isDev: process.env.NODE_ENV !== 'production',
};

// Validate required config
if (!config.mongoUri) {
  throw new Error('MONGODB_URI environment variable is required');
}
