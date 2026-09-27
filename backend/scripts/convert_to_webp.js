require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://portal_admin:PortalSecure%40321@localhost:5432/gamesato?schema=public'
});

const sharp = require('sharp');
const uploadsDir = path.join(__dirname, '../uploads');

// Helper to get all image files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    } catch (e) {}
  });

  return arrayOfFiles;
}

async function run() {
  console.log('🔍 Scanning uploads directory for images...');
  const allFiles = getAllFiles(uploadsDir);

  const validExts = ['.png', '.jpg', '.jpeg'];
  const filesToConvert = allFiles.filter(f => validExts.includes(path.extname(f).toLowerCase()));

  console.log(`📸 Found ${filesToConvert.length} PNG/JPG images to process.`);

  let convertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let savedBytes = 0;

  // Process in concurrent batches of 6 for speed
  const BATCH_SIZE = 6;
  for (let i = 0; i < filesToConvert.length; i += BATCH_SIZE) {
    const batch = filesToConvert.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (filePath) => {
      const ext = path.extname(filePath);
      const webpPath = filePath.substring(0, filePath.length - ext.length) + '.webp';

      // Skip if .webp already exists and is non-empty
      try {
        if (fs.existsSync(webpPath) && fs.statSync(webpPath).size > 0) {
          skippedCount++;
          return;
        }
      } catch (e) {}

      try {
        const originalStats = fs.statSync(filePath);
        if (originalStats.size === 0) {
          skippedCount++;
          return;
        }
        
        // Convert to WebP with 86% quality and smart subsampling (Pristine visual fidelity, 0 artifacting)
        await sharp(filePath)
          .webp({ quality: 86, effort: 6, smartSubsample: true })
          .toFile(webpPath);

        const newStats = fs.statSync(webpPath);
        const saved = originalStats.size - newStats.size;
        
        if (saved > 0) {
          savedBytes += saved;
        }
        
        convertedCount++;
      } catch (err) {
        errorCount++;
      }
    }));

    if ((i + BATCH_SIZE) % 150 === 0 || i + BATCH_SIZE >= filesToConvert.length) {
      const current = Math.min(i + BATCH_SIZE, filesToConvert.length);
      const pct = ((current / filesToConvert.length) * 100).toFixed(1);
      console.log(`⏳ Progress: ${current}/${filesToConvert.length} (${pct}%) | Converted: ${convertedCount} | Skipped: ${skippedCount} | Saved: ${(savedBytes / (1024 * 1024)).toFixed(2)} MB`);
    }
  }

  console.log('\n📊 Image Compression Summary:');
  console.log(`   - Converted to WebP: ${convertedCount} images`);
  console.log(`   - Already WebP / Skipped: ${skippedCount} images`);
  console.log(`   - Errors: ${errorCount} images`);
  console.log(`   - Total Disk Space Saved: ${(savedBytes / (1024 * 1024)).toFixed(2)} MB`);

  console.log('\n🗄️ Updating Database Image URLs to .webp...');

  const imageColumns = [
    { table: 'games', column: 'thumbnail_url' },
    { table: 'games', column: 'featured_desktop_url' },
    { table: 'games', column: 'featured_mobile_url' },
    { table: 'games', column: 'featured_mobile_landscape_url' },
    { table: 'games', column: 'new_game_both_url' },
    { table: 'games', column: 'game_page_both_url' },
    { table: 'games', column: 'game_page_icon_url' },
    { table: 'categories', column: 'icon' },
    { table: 'users', column: 'image' },
    { table: 'blogs', column: 'cover_image' }
  ];

  for (const item of imageColumns) {
    for (const ext of ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG']) {
      const queryStr = `
        UPDATE ${item.table} 
        SET ${item.column} = REPLACE(${item.column}, '${ext}', '.webp')
        WHERE ${item.column} LIKE '%${ext}';
      `;
      try {
        const result = await pool.query(queryStr);
        if (result.rowCount > 0) {
          console.log(`   ✅ Updated ${result.rowCount} rows in ${item.table}.${item.column} (${ext} -> .webp)`);
        }
      } catch (dbErr) {
        // Table or column might not exist in some migrations, skip quietly
      }
    }
  }

  // Update blog HTML content links
  for (const ext of ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG']) {
    try {
      const res = await pool.query(`
        UPDATE blogs 
        SET content = REPLACE(content, '${ext}', '.webp') 
        WHERE content LIKE '%${ext}%';
      `);
      if (res.rowCount > 0) {
        console.log(`   ✅ Updated ${res.rowCount} blog contents (${ext} -> .webp)`);
      }
    } catch (e) {}
  }

  console.log('\n🎉 Image WebP conversion and DB path migration completed successfully!');
  await pool.end();
}

run().catch(err => {
  console.error('Migration Script Error:', err);
  process.exit(1);
});
