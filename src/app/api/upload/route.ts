//my-app\src\app\api\upload\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    // Generate unique filename to prevent overwriting
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    const path = join(uploadDir, filename);

    // Write file
    await writeFile(path, buffer);

    // Return the path where the file was saved
    return NextResponse.json({ 
      message: 'File uploaded successfully',
      url: `/uploads/${filename}`  // Asegúrate de que sea "url" y no "filename"
    }, { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'File upload failed', 
      details: error.message 
    }, { status: 500 });
  }
}