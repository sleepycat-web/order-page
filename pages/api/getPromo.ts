import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';
import { Promo } from '../../scripts/promo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const promos: Promo[] = await db.collection<Promo>('PromoCodes').find().toArray();
      res.status(200).json(promos);
    } catch (error) {
      console.error("Error fetching promos:", error);
      res.status(500).json({ error: 'Failed to load promos' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}