import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const products = await prisma.product.findMany();
        res.status(200).json(products);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
      }
      break;

    case 'POST':
      try {
        const product = await prisma.product.create({
          data: req.body,
        });
        res.status(201).json(product);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
      }
      break;

    case 'PUT':
      try {
        const { id, ...data } = req.body;
        const product = await prisma.product.update({
          where: { id },
          data,
        });
        res.status(200).json(product);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.body;
        await prisma.product.delete({
          where: { id },
        });
        res.status(200).json({ message: 'Product deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}