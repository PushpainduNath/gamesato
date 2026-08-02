import multer from 'multer';
import path from 'path';
import fsSync from 'fs';
import { promises as fsPromises } from 'fs';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';

dotenv.config();

const GAMES_DIR = process.env.GAMES_DIR || path.join(__dirname, '../../../gb-games');

// Ensure the game builds directory exists
if (!fsSync.existsSync(GAMES_DIR)) {
  fsSync.mkdirSync(GAMES_DIR, { recursive: true });
}

// Multer storage configuration for temporary zip files
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    if (!fsSync.existsSync(tempDir)) {
      fsSync.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter: accept zip only for builds, and standard images for thumbnails/icons
export const upload = multer({
  storage: tempStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'zip') {
      if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
        cb(null, true);
      } else {
        cb(new Error('Only ZIP archives are allowed for game builds!'));
      }
    } else if (
      file.fieldname === 'thumbnail' ||
      file.fieldname === 'featured_desktop' ||
      file.fieldname === 'featured_mobile' ||
      file.fieldname === 'new_game_both' ||
      file.fieldname === 'game_page_both' ||
      file.fieldname === 'icon'
    ) {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error(`Only images are allowed for ${file.fieldname}!`));
      }
    } else {
      cb(new Error('Unexpected field name: ' + file.fieldname));
    }
  },
});

/**
 * Extract H5 Game Build ZIP to destination directory
 */
export async function extractGameBuild(zipPath: string, slug: string): Promise<string> {
  const destDir = path.join(GAMES_DIR, slug);
  
  // Clean up destination directory if it already exists
  if (fsSync.existsSync(destDir)) {
    await fsPromises.rm(destDir, { recursive: true, force: true });
  }
  
  await fsPromises.mkdir(destDir, { recursive: true });

  const zip = new AdmZip(zipPath);
  
  return new Promise((resolve, reject) => {
    try {
      zip.extractAllTo(destDir, true);
      
      // Verify that there is an index.html file in the root or inside a subdirectory
      let indexHtmlPath = path.join(destDir, 'index.html');
      
      if (!fsSync.existsSync(indexHtmlPath)) {
        // If not found in root, look in direct children (sometimes zips contain a wrapping folder)
        const files = fsSync.readdirSync(destDir);
        const folders = files.filter(f => fsSync.statSync(path.join(destDir, f)).isDirectory());
        
        let found = false;
        for (const folder of folders) {
          const checkPath = path.join(destDir, folder, 'index.html');
          if (fsSync.existsSync(checkPath)) {
            // Found index.html inside a subdirectory, we will return the path pointing to this
            indexHtmlPath = checkPath;
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.warn(`Warning: Game ZIP extracted but index.html was not found in root or subdirectories of ${destDir}`);
        }
      }
      
      resolve(destDir);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Delete Game build directory and thumbnail
 */
export async function deleteGameFiles(slug: string, thumbnailUrl: string | null) {
  const destDir = path.join(GAMES_DIR, slug);
  
  // 1. Delete H5 files
  if (fsSync.existsSync(destDir)) {
    await fsPromises.rm(destDir, { recursive: true, force: true });
  }

  // 2. Delete thumbnail if stored locally
  if (thumbnailUrl && thumbnailUrl.startsWith('/uploads/thumbnails/')) {
    const thumbName = path.basename(thumbnailUrl);
    const thumbPath = path.join(__dirname, '../../uploads/thumbnails', thumbName);
    if (fsSync.existsSync(thumbPath)) {
      await fsPromises.unlink(thumbPath);
    }
  }
}

/**
 * Clean up orphaned folders in gb-games
 */
export async function cleanOrphanedDirectories(activeSlugs: string[]) {
  try {
    if (!fsSync.existsSync(GAMES_DIR)) return;
    
    const directories = await fsPromises.readdir(GAMES_DIR);
    const slugSet = new Set(activeSlugs);
    
    for (const dirName of directories) {
      const fullPath = path.join(GAMES_DIR, dirName);
      const stat = await fsPromises.stat(fullPath);
      
      if (stat.isDirectory() && !slugSet.has(dirName)) {
        console.log(`Cleaning up orphaned game directory: ${dirName}`);
        await fsPromises.rm(fullPath, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.error('Error during orphaned directories cleanup:', err);
  }
}

/**
 * Save game thumbnail file locally
 */
export async function saveThumbnail(tempPath: string, slug: string, originalName: string): Promise<string> {
  const thumbnailDir = path.join(__dirname, '../../uploads/thumbnails');
  if (!fsSync.existsSync(thumbnailDir)) {
    fsSync.mkdirSync(thumbnailDir, { recursive: true });
  }
  
  const ext = path.extname(originalName) || '.jpg';
  const newName = `${slug}-${Date.now()}${ext}`;
  const targetPath = path.join(thumbnailDir, newName);
  
  await fsPromises.rename(tempPath, targetPath);
  return `/uploads/thumbnails/${newName}`;
}

/**
 * Delete a local image by its URL
 */
export async function deleteLocalImage(imageUrl: string | null) {
  if (imageUrl && (imageUrl.startsWith('/uploads/thumbnails/') || imageUrl.startsWith('/uploads/icons/'))) {
    const subDir = imageUrl.startsWith('/uploads/thumbnails/') ? 'thumbnails' : 'icons';
    const fileName = path.basename(imageUrl);
    const filePath = path.join(__dirname, '../../uploads', subDir, fileName);
    if (fsSync.existsSync(filePath)) {
      try {
        await fsPromises.unlink(filePath);
      } catch (err) {
        console.error('Failed to delete image file:', filePath, err);
      }
    }
  }
}

/**
 * Save category icon file locally
 */
export async function saveCategoryIcon(tempPath: string, slug: string, originalName: string): Promise<string> {
  const iconDir = path.join(__dirname, '../../uploads/icons');
  if (!fsSync.existsSync(iconDir)) {
    fsSync.mkdirSync(iconDir, { recursive: true });
  }
  
  const ext = path.extname(originalName) || '.svg';
  const newName = `${slug}-${Date.now()}${ext}`;
  const targetPath = path.join(iconDir, newName);
  
  await fsPromises.rename(tempPath, targetPath);
  return `/uploads/icons/${newName}`;
}

export interface FileEntryInfo {
  name: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  type: string;
}

export interface GameFilesInfo {
  slug: string;
  folderExists: boolean;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  hasIndexHtml: boolean;
  indexHtmlPath: string | null;
  fileCount: number;
  files: FileEntryInfo[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Inspect game build directory, return file list, sizes and index.html status
 */
export async function getGameFilesInfo(slug: string): Promise<GameFilesInfo> {
  const destDir = path.join(GAMES_DIR, slug);
  if (!fsSync.existsSync(destDir)) {
    return {
      slug,
      folderExists: false,
      totalSizeBytes: 0,
      totalSizeFormatted: '0 B',
      hasIndexHtml: false,
      indexHtmlPath: null,
      fileCount: 0,
      files: []
    };
  }

  let totalSizeBytes = 0;
  let fileCount = 0;
  let hasIndexHtml = false;
  let indexHtmlPath: string | null = null;
  const fileEntries: FileEntryInfo[] = [];

  async function walkDir(currentDir: string, relativeDir: string = '') {
    const items = await fsPromises.readdir(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relPath = relativeDir ? `${relativeDir}/${item}` : item;
      const stat = await fsPromises.stat(fullPath);

      if (stat.isDirectory()) {
        await walkDir(fullPath, relPath);
      } else if (stat.isFile()) {
        totalSizeBytes += stat.size;
        fileCount++;

        const ext = path.extname(item).toLowerCase();
        let type = 'FILE';
        if (ext === '.html' || ext === '.htm') type = 'HTML';
        else if (ext === '.js') type = 'JS';
        else if (ext === '.css') type = 'CSS';
        else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) type = 'IMAGE';
        else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) type = 'AUDIO';
        else if (['.json', '.xml'].includes(ext)) type = 'DATA';

        if (item.toLowerCase() === 'index.html' && (!hasIndexHtml || relPath === 'index.html')) {
          hasIndexHtml = true;
          indexHtmlPath = `/games/${slug}/${relPath}`;
        }

        fileEntries.push({
          name: item,
          relativePath: relPath,
          sizeBytes: stat.size,
          sizeFormatted: formatBytes(stat.size),
          type
        });
      }
    }
  }

  await walkDir(destDir);

  fileEntries.sort((a, b) => {
    if (a.name.toLowerCase() === 'index.html') return -1;
    if (b.name.toLowerCase() === 'index.html') return 1;
    return b.sizeBytes - a.sizeBytes;
  });

  return {
    slug,
    folderExists: true,
    totalSizeBytes,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    hasIndexHtml,
    indexHtmlPath,
    fileCount,
    files: fileEntries
  };
}

/**
 * Quick sync check to verify if physical game build (index.html or folder) exists on disk
 */
export function hasGameBuildFiles(slug: string): boolean {
  if (!slug) return false;
  const destDir = path.join(GAMES_DIR, slug);
  if (!fsSync.existsSync(destDir)) return false;
  const indexHtmlPath = path.join(destDir, 'index.html');
  return fsSync.existsSync(indexHtmlPath);
}
