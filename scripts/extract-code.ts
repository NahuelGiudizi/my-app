const fs = require('fs');
const path = require('path');
const util = require('util');

// Convertir métodos fs a promesas
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Archivos y directorios a ignorar
const ignoreList: string[] = [
  '.git',
  'node_modules',
  'dist',
  '.next',
  '.vercel',
  'package-lock.json',
  'yarn.lock',
  '.DS_Store',
  '*.log',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.ico',
  '*.svg'
];

// Extensiones de archivos que contienen código
const codeExtensions: string[] = [
  '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', 
  '.md', '.mdx', '.prisma', '.graphql', '.yml', '.yaml', '.env',
  '.config.js', '.config.ts', '.config.mjs', '.mjs'
];

// Función para verificar si un archivo/directorio debe ignorarse
function shouldIgnore(filePath: string): boolean {
  return ignoreList.some(pattern => {
    if (pattern.startsWith('*.')) {
      // Es un patrón de extensión
      const ext = pattern.replace('*', '');
      return filePath.endsWith(ext);
    }
    return filePath.includes(pattern);
  });
}

// Función para verificar si un archivo contiene código
function isCodeFile(filePath: string): boolean {
  return codeExtensions.some(ext => {
    if (ext.startsWith('.config.')) {
      return filePath.endsWith(ext);
    }
    return path.extname(filePath) === ext;
  });
}

// Función principal para recorrer directorios recursivamente
async function traverseDirectory(dir: string, output: string = '', baseDir: string = ''): Promise<string> {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const relativePath = path.join(baseDir, file);
      
      if (shouldIgnore(filePath)) {
        continue;
      }
      
      const fileStat = await stat(filePath);
      
      if (fileStat.isDirectory()) {
        // Si es un directorio, recorrer recursivamente
        output = await traverseDirectory(filePath, output, relativePath);
      } else if (isCodeFile(filePath)) {
        try {
          // Si es un archivo de código, leer su contenido
          const content = await readFile(filePath, 'utf8');
          output += `\n\n=====================================================\n`;
          output += `Archivo: ${relativePath}\n`;
          output += `=====================================================\n\n`;
          output += content;
        } catch (error) {
          output += `\n\n=====================================================\n`;
          output += `Error al leer el archivo: ${relativePath}\n`;
          output += `=====================================================\n\n`;
          output += `Error: ${(error as Error).message}`;
        }
      }
    }
    
    return output;
  } catch (error) {
    console.error(`Error al leer el directorio ${dir}:`, error);
    return output;
  }
}

// Punto de entrada del script
async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const outputFile = path.join(projectRoot, 'project-code.txt');
  
  console.log(`Analizando el proyecto en: ${projectRoot}`);
  console.log('Extrayendo código, por favor espera...');
  
  let output = `CÓDIGO DEL PROYECTO\nGenerado: ${new Date().toLocaleString()}\n`;
  output = await traverseDirectory(projectRoot, output);
  
  await writeFile(outputFile, output, 'utf8');
  
  console.log(`\n✅ Proceso completado. Código extraído en: ${outputFile}`);
  console.log(`Total caracteres generados: ${output.length}`);
}

main().catch(error => {
  console.error('Error en el proceso:', error);
  process.exit(1);
});

module.exports = {};