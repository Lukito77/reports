import { createApp } from '../app.js';

const { app, connectToDatabase } = createApp();

export default async function handler(req: any, res: any) {
  await connectToDatabase();
  return app(req, res);
}