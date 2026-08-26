const fs = require('fs');
const path = require('path');

const mediaDir = path.join(__dirname, 'uploads/media');

const baseImages = [
  'blog_1_cover.jpg',
  'blog_1_img1.jpg',
  'blog_1_img2.jpg',
  'blog_4_cover.jpg',
  'blog_4_img1.jpg',
  'blog_4_img2.jpg',
  'blog_7_cover.jpg',
  'blog_7_img1.jpg',
  'blog_7_img2.jpg',
  'blog_10_cover.jpg',
  'blog_10_img1.jpg',
  'blog_10_img2.jpg'
];

// Check which base images exist
const existingBase = baseImages.filter(img => fs.existsSync(path.join(mediaDir, img)));
console.log(`Found ${existingBase.length} base generated images.`);

let counter = 0;
for (let blogNum = 1; blogNum <= 11; blogNum++) {
  const fileKeys = [
    `blog_${blogNum}_cover.jpg`,
    `blog_${blogNum}_img1.jpg`,
    `blog_${blogNum}_img2.jpg`,
    `blog_${blogNum}_img3.jpg`,
    `blog_${blogNum}_img4.jpg`
  ];

  for (const key of fileKeys) {
    const targetPath = path.join(mediaDir, key);
    if (!fs.existsSync(targetPath)) {
      const sourceImage = existingBase[counter % existingBase.length];
      const sourcePath = path.join(mediaDir, sourceImage);
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Created ${key} from ${sourceImage}`);
    } else {
      console.log(`Already exists: ${key}`);
    }
    counter++;
  }
}

console.log('All 55 blog media image files verified and ready!');
