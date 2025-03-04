//my-app\src\lib\prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Middleware de auditoría
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  console.log(`Query ${params.model}.${params.action} took ${duration}ms`);
  
  if (duration > 2000) {
    console.warn('Slow query detected:', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`
    });
  }
  
  return result;
});

export default prisma;