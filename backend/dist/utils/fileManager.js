"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.extractGameBuild = extractGameBuild;
exports.deleteGameFiles = deleteGameFiles;
exports.cleanOrphanedDirectories = cleanOrphanedDirectories;
exports.saveThumbnail = saveThumbnail;
exports.deleteLocalImage = deleteLocalImage;
exports.saveCategoryIcon = saveCategoryIcon;
exports.getGameFilesInfo = getGameFilesInfo;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fs_2 = require("fs");
const adm_zip_1 = __importDefault(require("adm-zip"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const GAMES_DIR = process.env.GAMES_DIR || path_1.default.join(__dirname, '../../../gb-games');
// Ensure the game builds directory exists
if (!fs_1.default.existsSync(GAMES_DIR)) {
    fs_1.default.mkdirSync(GAMES_DIR, { recursive: true });
}
// Multer storage configuration for temporary zip files
const tempStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path_1.default.join(__dirname, '../../uploads/temp');
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
// File filter: accept zip only for builds, and standard images for thumbnails/icons
exports.upload = (0, multer_1.default)({
    storage: tempStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'zip') {
            if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
                cb(null, true);
            }
            else {
                cb(new Error('Only ZIP archives are allowed for game builds!'));
            }
        }
        else if (file.fieldname === 'thumbnail' ||
            file.fieldname === 'featured_desktop' ||
            file.fieldname === 'featured_mobile' ||
            file.fieldname === 'new_game_both' ||
            file.fieldname === 'game_page_both' ||
            file.fieldname === 'icon') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            }
            else {
                cb(new Error(`Only images are allowed for ${file.fieldname}!`));
            }
        }
        else {
            cb(new Error('Unexpected field name: ' + file.fieldname));
        }
    },
});
/**
 * Extract H5 Game Build ZIP to destination directory
 */
async function extractGameBuild(zipPath, slug) {
    const destDir = path_1.default.join(GAMES_DIR, slug);
    // Clean up destination directory if it already exists
    if (fs_1.default.existsSync(destDir)) {
        await fs_2.promises.rm(destDir, { recursive: true, force: true });
    }
    await fs_2.promises.mkdir(destDir, { recursive: true });
    const zip = new adm_zip_1.default(zipPath);
    return new Promise((resolve, reject) => {
        try {
            zip.extractAllTo(destDir, true);
            // Verify that there is an index.html file in the root or inside a subdirectory
            let indexHtmlPath = path_1.default.join(destDir, 'index.html');
            if (!fs_1.default.existsSync(indexHtmlPath)) {
                // If not found in root, look in direct children (sometimes zips contain a wrapping folder)
                const files = fs_1.default.readdirSync(destDir);
                const folders = files.filter(f => fs_1.default.statSync(path_1.default.join(destDir, f)).isDirectory());
                let found = false;
                for (const folder of folders) {
                    const checkPath = path_1.default.join(destDir, folder, 'index.html');
                    if (fs_1.default.existsSync(checkPath)) {
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
        }
        catch (err) {
            reject(err);
        }
    });
}
/**
 * Delete Game build directory and thumbnail
 */
async function deleteGameFiles(slug, thumbnailUrl) {
    const destDir = path_1.default.join(GAMES_DIR, slug);
    // 1. Delete H5 files
    if (fs_1.default.existsSync(destDir)) {
        await fs_2.promises.rm(destDir, { recursive: true, force: true });
    }
    // 2. Delete thumbnail if stored locally
    if (thumbnailUrl && thumbnailUrl.startsWith('/uploads/thumbnails/')) {
        const thumbName = path_1.default.basename(thumbnailUrl);
        const thumbPath = path_1.default.join(__dirname, '../../uploads/thumbnails', thumbName);
        if (fs_1.default.existsSync(thumbPath)) {
            await fs_2.promises.unlink(thumbPath);
        }
    }
}
/**
 * Clean up orphaned folders in gb-games
 */
async function cleanOrphanedDirectories(activeSlugs) {
    try {
        if (!fs_1.default.existsSync(GAMES_DIR))
            return;
        const directories = await fs_2.promises.readdir(GAMES_DIR);
        const slugSet = new Set(activeSlugs);
        for (const dirName of directories) {
            const fullPath = path_1.default.join(GAMES_DIR, dirName);
            const stat = await fs_2.promises.stat(fullPath);
            if (stat.isDirectory() && !slugSet.has(dirName)) {
                console.log(`Cleaning up orphaned game directory: ${dirName}`);
                await fs_2.promises.rm(fullPath, { recursive: true, force: true });
            }
        }
    }
    catch (err) {
        console.error('Error during orphaned directories cleanup:', err);
    }
}
/**
 * Save game thumbnail file locally
 */
async function saveThumbnail(tempPath, slug, originalName) {
    const thumbnailDir = path_1.default.join(__dirname, '../../uploads/thumbnails');
    if (!fs_1.default.existsSync(thumbnailDir)) {
        fs_1.default.mkdirSync(thumbnailDir, { recursive: true });
    }
    const ext = path_1.default.extname(originalName) || '.jpg';
    const newName = `${slug}-${Date.now()}${ext}`;
    const targetPath = path_1.default.join(thumbnailDir, newName);
    await fs_2.promises.rename(tempPath, targetPath);
    return `/uploads/thumbnails/${newName}`;
}
/**
 * Delete a local image by its URL
 */
async function deleteLocalImage(imageUrl) {
    if (imageUrl && (imageUrl.startsWith('/uploads/thumbnails/') || imageUrl.startsWith('/uploads/icons/'))) {
        const subDir = imageUrl.startsWith('/uploads/thumbnails/') ? 'thumbnails' : 'icons';
        const fileName = path_1.default.basename(imageUrl);
        const filePath = path_1.default.join(__dirname, '../../uploads', subDir, fileName);
        if (fs_1.default.existsSync(filePath)) {
            try {
                await fs_2.promises.unlink(filePath);
            }
            catch (err) {
                console.error('Failed to delete image file:', filePath, err);
            }
        }
    }
}
/**
 * Save category icon file locally
 */
async function saveCategoryIcon(tempPath, slug, originalName) {
    const iconDir = path_1.default.join(__dirname, '../../uploads/icons');
    if (!fs_1.default.existsSync(iconDir)) {
        fs_1.default.mkdirSync(iconDir, { recursive: true });
    }
    const ext = path_1.default.extname(originalName) || '.svg';
    const newName = `${slug}-${Date.now()}${ext}`;
    const targetPath = path_1.default.join(iconDir, newName);
    await fs_2.promises.rename(tempPath, targetPath);
    return `/uploads/icons/${newName}`;
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Inspect game build directory, return file list, sizes and index.html status
 */
async function getGameFilesInfo(slug) {
    const destDir = path_1.default.join(GAMES_DIR, slug);
    if (!fs_1.default.existsSync(destDir)) {
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
    let indexHtmlPath = null;
    const fileEntries = [];
    async function walkDir(currentDir, relativeDir = '') {
        const items = await fs_2.promises.readdir(currentDir);
        for (const item of items) {
            const fullPath = path_1.default.join(currentDir, item);
            const relPath = relativeDir ? `${relativeDir}/${item}` : item;
            const stat = await fs_2.promises.stat(fullPath);
            if (stat.isDirectory()) {
                await walkDir(fullPath, relPath);
            }
            else if (stat.isFile()) {
                totalSizeBytes += stat.size;
                fileCount++;
                const ext = path_1.default.extname(item).toLowerCase();
                let type = 'FILE';
                if (ext === '.html' || ext === '.htm')
                    type = 'HTML';
                else if (ext === '.js')
                    type = 'JS';
                else if (ext === '.css')
                    type = 'CSS';
                else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext))
                    type = 'IMAGE';
                else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext))
                    type = 'AUDIO';
                else if (['.json', '.xml'].includes(ext))
                    type = 'DATA';
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
        if (a.name.toLowerCase() === 'index.html')
            return -1;
        if (b.name.toLowerCase() === 'index.html')
            return 1;
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
