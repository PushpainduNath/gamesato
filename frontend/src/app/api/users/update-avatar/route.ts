import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    let imagePath = image;

    // Check if the image sent is a base64 string
    if (image.startsWith('data:image/')) {
      // Extract the format extension and the base64 content
      const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 });
      }

      const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Define absolute directory path
      const uploadDir = path.join(process.cwd(), '..', 'backend', 'uploads', 'avatars');

      // Create uploads/avatars folder if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Fetch user's current avatar path to delete the old file if it exists
      const userRes = await query('SELECT image FROM users WHERE id = $1', [session.user.id]);
      if (userRes.rows.length > 0) {
        const currentImage = userRes.rows[0].image;
        if (currentImage && currentImage.startsWith('/uploads/avatars/')) {
          const oldFilePath = path.join(process.cwd(), '..', 'backend', currentImage);
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
            } catch (unlinkErr) {
              console.error('Failed to delete old avatar file:', unlinkErr);
            }
          }
        }
      }

      // Write new file to disk
      const filename = `avatar-${session.user.id}-${Date.now()}.${extension}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      // Save database relative path (accessible in browser via public path)
      imagePath = `/uploads/avatars/${filename}`;
    }

    await query('UPDATE users SET image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [imagePath, session.user.id]);
    return NextResponse.json({ success: true, url: imagePath });
  } catch (err) {
    console.error('Failed to update profile avatar:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
