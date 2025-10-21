import { config } from 'dotenv';
import { NativeConnection } from '@temporalio/worker';
import { Worker } from '@temporalio/worker';
import * as activities from './activities.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local file
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TASK_QUEUE = 'email-scheduling';

async function run() {
  const { TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, TEMPORAL_API_KEY } = process.env;
  if (!TEMPORAL_ADDRESS || !TEMPORAL_NAMESPACE || !TEMPORAL_API_KEY) {
    throw new Error('Set TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, TEMPORAL_API_KEY in env');
  }

  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
    tls: {},                   
    apiKey: TEMPORAL_API_KEY,
  });

  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: TASK_QUEUE,
    workflowsPath: join(__dirname, 'workflows.ts'),
    activities,
  });

  console.log(`[worker] connected to ${TEMPORAL_ADDRESS} ns=${TEMPORAL_NAMESPACE}`);
  console.log(`[worker] task queue: ${TASK_QUEUE}`);
  await worker.run(); 
}

run().catch((err) => {
  console.error('[worker] fatal', err);
  process.exit(1);
});
