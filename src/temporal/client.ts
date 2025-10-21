import { Connection, Client } from '@temporalio/client';

let client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (client) return client;

  const address = process.env.TEMPORAL_ADDRESS; 
  const namespace = process.env.TEMPORAL_NAMESPACE; 
  const apiKey = process.env.TEMPORAL_API_KEY;

  if (!address || !namespace || !apiKey) {
    throw new Error(
      'Missing Temporal env vars. Set TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, TEMPORAL_API_KEY'
    );
  }

  try {
    const connection = await Connection.connect({
      address,
      tls: {},         
      apiKey,          
    });

    client = new Client({
      connection,
      namespace,
    });

    return client;
  } catch (error) {
    console.error('Failed to connect to Temporal:', error);
    throw new Error('Temporal connection failed. Make sure the Cloud address/api key/namespace are correct.');
  }
}
