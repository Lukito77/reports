import { createApp } from '../app';
import { connectMongo } from '../lib/mongoose';

let isConnected = false;

const app = createApp();

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    await connectMongo();
    isConnected = true;
  }
  return app(req, res);
}