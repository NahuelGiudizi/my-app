const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Intenta obtener la estructura de la tabla Barbero
    const tableInfo = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Barbero'
    `;
    console.log('Columns in Barbero table:', tableInfo);
    
    // Intenta hacer una consulta simple
    const firstBarber = await prisma.barbero.findFirst();
    console.log('First barber:', firstBarber);
    
    // Muestra los campos disponibles en el modelo Prisma
    console.log('Available fields in Prisma Barbero model:', Object.keys(prisma.barbero.fields));
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });