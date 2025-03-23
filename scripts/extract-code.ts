const fs = require('fs');
const path = require('path');
const util = require('util');

// Convertir métodos fs a promesas
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

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

// Configuración para la división de archivos
const MAX_LINES_PER_FILE = 6500; // Aproximadamente 6500 líneas por archivo
const OUTPUT_DIR = 'codigo-proyecto';

// Función para verificar si un archivo/directorio debe ignorarse
function shouldIgnore(filePath: string): boolean {
  // Ignorar la carpeta de salida
  if (filePath.includes(OUTPUT_DIR)) {
    return true;
  }

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

// Clase para manejar la división de archivos
class ChunkedOutput {
  private currentChunk: string;
  private currentLineCount: number;
  private chunkIndex: number;
  private totalSize: number;
  private totalLines: number;
  private outputDir: string;
  private filePrefix: string;
  private chunkSizes: { index: number, size: number, lines: number }[];

  constructor(outputDir: string, filePrefix: string) {
    this.currentChunk = '';
    this.currentLineCount = 0;
    this.chunkIndex = 1;
    this.totalSize = 0;
    this.totalLines = 0;
    this.outputDir = outputDir;
    this.filePrefix = filePrefix;
    this.chunkSizes = [];
  }

  async append(content: string): Promise<void> {
    const contentLines = content.split('\n').length;

    // Si añadir el contenido excede el máximo de líneas, guardar el chunk actual y empezar uno nuevo
    if (this.currentLineCount + contentLines > MAX_LINES_PER_FILE && this.currentLineCount > 0) {
      await this.saveCurrentChunk();
    }

    // Si el contenido por sí solo tiene más líneas que el máximo, dividirlo
    if (contentLines > MAX_LINES_PER_FILE) {
      const chunks = this.splitLargeContent(content);
      for (const chunk of chunks) {
        this.currentChunk = chunk.text;
        this.currentLineCount = chunk.lines;
        await this.saveCurrentChunk();
      }
    } else {
      this.currentChunk += content;
      this.currentLineCount += contentLines;
    }

    this.totalSize += content.length;
    this.totalLines += contentLines;
  }

  // Divide un contenido grande en trozos basados en número de líneas
  private splitLargeContent(content: string): Array<{ text: string, lines: number }> {
    const chunks: Array<{ text: string, lines: number }> = [];
    const lines = content.split('\n');
    let currentChunk = '';
    let lineCount = 0;

    for (const line of lines) {
      // Si añadir esta línea excede el límite, guardar el chunk actual y empezar uno nuevo
      if (lineCount >= MAX_LINES_PER_FILE) {
        chunks.push({
          text: currentChunk,
          lines: lineCount
        });
        currentChunk = '';
        lineCount = 0;
      }

      currentChunk += line + '\n';
      lineCount++;
    }

    // Añadir el último chunk si tiene contenido
    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk,
        lines: lineCount
      });
    }

    return chunks;
  }

  async saveCurrentChunk(): Promise<void> {
    if (this.currentChunk.length === 0) {
      return;
    }

    const fileName = `${this.filePrefix}-parte${this.chunkIndex.toString().padStart(3, '0')}.txt`;
    const filePath = path.join(this.outputDir, fileName);

    await writeFile(filePath, this.currentChunk, 'utf8');

    this.chunkSizes.push({
      index: this.chunkIndex,
      size: this.currentChunk.length,
      lines: this.currentLineCount
    });

    console.log(`Guardado: ${fileName} (${this.currentLineCount.toLocaleString()} líneas, ${(this.currentChunk.length / 1024).toFixed(2)} KB)`);

    this.chunkIndex++;
    this.currentChunk = '';
    this.currentLineCount = 0;
  }

  async finalize(): Promise<void> {
    // Guardar el último chunk si tiene contenido
    if (this.currentChunk.length > 0) {
      await this.saveCurrentChunk();
    }

    // Crear un archivo de índice
    const indexContent = `ÍNDICE DE ARCHIVOS DEL PROYECTO
Generado: ${new Date().toLocaleString()}
Total de archivos: ${this.chunkIndex - 1}
Total líneas: ${this.totalLines.toLocaleString()}
Tamaño total: ${(this.totalSize / 1024 / 1024).toFixed(2)} MB

${this.chunkSizes.map(chunk =>
      `${chunk.index}. ${this.filePrefix}-parte${chunk.index.toString().padStart(3, '0')}.txt - ${chunk.lines.toLocaleString()} líneas - ${(chunk.size / 1024).toFixed(2)} KB`
    ).join('\n')}
`;

    await writeFile(path.join(this.outputDir, `${this.filePrefix}-indice.txt`), indexContent, 'utf8');
  }
}

// Función principal para recorrer directorios recursivamente
async function traverseDirectory(dir: string, output: ChunkedOutput, baseDir: string = ''): Promise<void> {
  try {
    const files = await readdir(dir);

    // Ordenar archivos para una salida más predecible
    files.sort();

    for (const file of files) {
      const filePath = path.join(dir, file);
      const relativePath = path.join(baseDir, file);

      if (shouldIgnore(filePath)) {
        continue;
      }

      const fileStat = await stat(filePath);

      if (fileStat.isDirectory()) {
        // Si es un directorio, recorrer recursivamente
        await output.append(`\n\n=====================================================\n`);
        await output.append(`DIRECTORIO: ${relativePath}\n`);
        await output.append(`=====================================================\n\n`);
        await traverseDirectory(filePath, output, relativePath);
      } else if (isCodeFile(filePath)) {
        try {
          // Si es un archivo de código, leer su contenido
          const content = await readFile(filePath, 'utf8');
          await output.append(`\n\n=====================================================\n`);
          await output.append(`Archivo: ${relativePath}\n`);
          await output.append(`=====================================================\n\n`);
          await output.append(content);
        } catch (error) {
          await output.append(`\n\n=====================================================\n`);
          await output.append(`Error al leer el archivo: ${relativePath}\n`);
          await output.append(`=====================================================\n\n`);
          await output.append(`Error: ${(error as Error).message}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error al leer el directorio ${dir}:`, error);
    await output.append(`\n\nError al leer el directorio ${dir}: ${(error as Error).message}\n\n`);
  }
}

// Punto de entrada del script
async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const outputDir = path.join(projectRoot, OUTPUT_DIR);

  // Crear directorio de salida si no existe
  try {
    await mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error(`Error al crear el directorio de salida:`, error);
    process.exit(1);
  }

  console.log(`Analizando el proyecto en: ${projectRoot}`);
  console.log(`Directorio de salida: ${outputDir}`);
  console.log('Extrayendo código, por favor espera...');

  const output = new ChunkedOutput(outputDir, 'proyecto');
  await output.append(`CÓDIGO DEL PROYECTO\nGenerado: ${new Date().toLocaleString()}\n`);

  await traverseDirectory(projectRoot, output);
  await output.finalize();

  console.log(`\n✅ Proceso completado. Código extraído en: ${outputDir}`);
}

main().catch(error => {
  console.error('Error en el proceso:', error);
  process.exit(1);
});

module.exports = {};