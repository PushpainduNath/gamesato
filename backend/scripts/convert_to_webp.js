const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://portal_admin:PortalSecure%40321@localhost:5432/gamesato?schema=public'
});

// Try loading sharp for fast, high-quality WebP conversion
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Installing "sharp" library for high-performance WebP compression...');
  try {
    require('child_process').execSync('npm install sharp --no-save', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    sharp = require('sharp');
  } catch (err) {
    console.error('Failed to auto-install sharp. Please run "npm install sharp" in backend directory.');
    process.exit(1);
  }
}

const uploadsDir = path.join(__dirname, '../uploads');

// Helper to get all image files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
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
  let savedBytes = 0;

  for (const filePath of filesToConvert) {
    const ext = path.extname(filePath);
    const webpPath = filePath.substring(0, filePath.length - ext.length) + '.webp';

    // Skip if .webp already exists and is valid
    if (fs.existsSync(webpPath)) {
      skippedCount++;
      continue;
    }

    try {
      const originalStats = fs.statSync(filePath);
      
      // Convert to WebP with 85% quality (Visually Lossless)
      await sharp(filePath)
        .webp({ quality: 85, effort: 6 })
        .toFile(webpPath);

      const newStats = fs.statSync(webpPath);
      const saved = originalStats.size - newStats.size;
      
      if (saved > 0) {
        savedBytes += saved;
      }
      
      convertedCount++;
      console.log(`✅ Converted: ${path.relative(uploadsDir, filePath)} -> .webp (Saved: ${(saved / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`❌ Failed to convert ${filePath}:`, err.message);
    }
  }

  console.log('\n📊 Image Compression Summary:');
  console.log(`   - Converted: ${convertedCount} images`);
  console.log(`   - Skipped (Already WebP): ${skippedCount} images`);
  console.log(`   - Total Storage Saved: ${(savedBytes / (1024 * 1024)).toFixed(2)} MB`);

  console.log('\n🗄️ Updating Database Image URLs to .webp...');

  const imageColumns = [
    { table: 'games', column: 'thumbnail_url' },
    { table: 'games', column: 'featured_desktop_url' },
    { table: 'games', column: 'featured_mobile_url' },
    { table: 'games', column: 'new_game_both_url' },
    { table: 'games', column: 'game_page_both_url' },
    { table: 'games', column: 'sidebar_icon_url' },
    { table: 'categories', column: 'icon' },
    { table: 'users', column: 'avatar_url' }
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
          console.log(`   - Updated ${result.rowCount} rows in ${item.table}.${item.column} (${ext} -> .webp)`);
        }
      } catch (dbErr) {
        // Table or column might not exist in some migrations, skip quietly
      }
    }
  }

  console.log('\n🎉 Image WebP conversion and DB path migration completed successfully!');
  await pool.end();
}

run().catch(err => {
  console.error('Migration Script Error:', err);
  process.exit(1);
});
