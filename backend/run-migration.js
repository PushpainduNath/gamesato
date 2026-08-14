const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL is not defined in backend/.env file');
  process.exit(1);
}

const client = new Client({
  connectionString
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database successfully!');

    // 1. Upgrade users table schema
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'google';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER';
    `);
    console.log('Users table upgraded successfully (provider, password_hash, is_blocked, role checked).');

    // 2. Upgrade games table schema
    await client.query(`
      ALTER TABLE games ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS featured_desktop_url VARCHAR(500);
      ALTER TABLE games ADD COLUMN IF NOT EXISTS featured_mobile_url VARCHAR(500);
      ALTER TABLE games ADD COLUMN IF NOT EXISTS game_page_icon_url VARCHAR(500);
      ALTER TABLE games ADD COLUMN IF NOT EXISTS featured_mobile_landscape_url VARCHAR(500);
      ALTER TABLE games ADD COLUMN IF NOT EXISTS new_game_both_url VARCHAR(500);
      ALTER TABLE games ADD COLUMN IF NOT EXISTS game_page_both_url VARCHAR(500);
      ALTER TABLE games ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
      ALTER TABLE games ADD COLUMN IF NOT EXISTS meta_description TEXT;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS meta_tags TEXT;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS how_to_play TEXT;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS orientation VARCHAR(20) DEFAULT 'AUTO';

      -- Auto-unmark featured games that do not have a featured image
      UPDATE games 
      SET is_featured = FALSE 
      WHERE is_featured = TRUE 
        AND (featured_desktop_url IS NULL OR featured_desktop_url = '') 
        AND (featured_mobile_url IS NULL OR featured_mobile_url = '');
    `);
    console.log('Games table upgraded successfully (featured layout urls, how_to_play & featured auto-unmark checked).');

    // 3. Create admin_users table schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255),
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(50) DEFAULT 'ADMIN',
          password_hash VARCHAR(255) NOT NULL,
          plain_password VARCHAR(255),
          is_blocked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Admin users table created/verified successfully.');

    // 4. Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          icon VARCHAR(255) DEFAULT '/arcade.svg',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Categories table created/verified successfully.');

    // 5. Seed default categories if they don't exist
    const defaultCategories = [
      { name: 'Racing', slug: 'racing', icon: '/racing.svg' },
      { name: 'Action', slug: 'action', icon: '/action.svg' },
      { name: 'Sport', slug: 'sport', icon: '/sports.svg' },
      { name: 'Arcade', slug: 'arcade', icon: '/arcade.svg' },
      { name: 'Logic', slug: 'logic', icon: '/logic.svg' },
      { name: 'Number', slug: 'number', icon: '/number.svg' },
      { name: 'Adventure', slug: 'adventure', icon: '/adventure.svg' },
      { name: 'Puzzle', slug: 'puzzle', icon: '/puzzle.svg' },
      { name: 'Board', slug: 'board', icon: '/board.svg' }
    ];

    for (const cat of defaultCategories) {
      await client.query(`
        INSERT INTO categories (name, slug, icon)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
      `, [cat.name, cat.slug, cat.icon]);
    }
    console.log('Default categories seeded successfully.');

    // 6. Create static_pages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS static_pages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          content TEXT DEFAULT '',
          status VARCHAR(50) DEFAULT 'published',
          meta_title VARCHAR(255),
          meta_description TEXT,
          meta_tags TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Static pages table created/verified successfully.');

    // 7. Seed default static pages if they don't exist
    const defaultPages = [
      {
        title: 'About Us',
        slug: 'about',
        content: '<h3>About Gamesato</h3><p>Welcome to Gamesato, your ultimate destination for high-quality, instant-play HTML5 games. We bring together a diverse catalog of fun and engaging games that you can play directly in your browser on mobile, tablet, or desktop.</p>',
        status: 'published',
        meta_title: 'About Gamesato - Play Free HTML5 Games Online',
        meta_description: 'Discover and play free HTML5 games instantly on Gamesato. No downloads or installations required.',
        meta_tags: 'about, gamesato, play free games, html5 games'
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy',
        content: '<h3>Privacy Policy</h3><p>At Gamesato, we take your privacy seriously. This privacy policy describes what information we collect, how we use it, and your rights to control your personal data.</p>',
        status: 'published',
        meta_title: 'Privacy Policy - Gamesato',
        meta_description: 'Read the privacy policy of Gamesato to learn how we collect, use, and protect your personal data.',
        meta_tags: 'privacy policy, gamesato, privacy, data protection'
      },
      {
        title: 'Terms of Service',
        slug: 'terms',
        content: '<h3>Terms of Service</h3><p>By accessing and playing games on Gamesato, you agree to comply with our Terms of Service. Please read these terms carefully before using our platform.</p>',
        status: 'published',
        meta_title: 'Terms of Service - Gamesato',
        meta_description: 'Review the Terms of Service for using the Gamesato platform and playing free online games.',
        meta_tags: 'terms of service, terms, gamesato'
      },
      {
        title: 'Contact Us',
        slug: 'contact',
        content: '<h3>Contact Gamesato</h3><p>Have questions, feedback, or business inquiries? Get in touch with the Gamesato team. We would love to hear from you!</p>',
        status: 'published',
        meta_title: 'Contact Us - Gamesato Support & Inquiries',
        meta_description: 'Get in touch with the Gamesato support, feedback, and business teams. We are here to help.',
        meta_tags: 'contact, gamesato support, business inquiry'
      },
      {
        title: 'Frequently Asked Questions',
        slug: 'faq',
        content: JSON.stringify([
          { q: 'Is Gamesato free to use?', a: 'Yes! All games on Gamesato are completely free to play directly in your web browser.' },
          { q: 'Do I need to download games?', a: 'No, there are no downloads or installations required. Just click and play!' },
          { q: 'Can I play games on my phone?', a: 'Absolutely. Gamesato is fully optimized for mobile devices, tablets, and desktop computers.' }
        ]),
        status: 'published',
        meta_title: 'Frequently Asked Questions - Gamesato Help Center',
        meta_description: 'Find quick answers to common questions about playing games, account creation, and platform compatibility on Gamesato.',
        meta_tags: 'faq, help center, gamesato help, common questions'
      },
      {
        title: 'Gamesato Intro Content',
        slug: 'home',
        content: '<h2 class="title text-gradient">Unlimited Free Gaming</h2><p>Experience the best instant-play browser games curated just for you. No installations, no ads disruption, just pure fun.</p>',
        status: 'published',
        meta_title: 'Gamesato - Play Free Online HTML5 Games',
        meta_description: 'Play the best free online HTML5 games on Gamesato. Explore racing, action, sports, arcade, adventure, logic, and more!',
        meta_tags: 'free online games, play html5 games, browser games, gamesato'
      }
    ];

    for (const page of defaultPages) {
      await client.query(`
        INSERT INTO static_pages (title, slug, content, status, meta_title, meta_description, meta_tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO NOTHING
      `, [page.title, page.slug, page.content, page.status, page.meta_title, page.meta_description, page.meta_tags]);
    }
    console.log('Default static pages seeded successfully.');

    // 9. Create site_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const defaultSettings = [
      { key: 'social_twitter', value: 'https://twitter.com' },
      { key: 'social_facebook', value: 'https://facebook.com' },
      { key: 'social_youtube', value: 'https://youtube.com' },
      { key: 'social_instagram', value: 'https://instagram.com' },
      { key: 'support_email', value: 'support@gamesato.com' },
      { key: 'site_name', value: 'Gamesato Portal' },
      { key: 'analytics_id', value: 'UA-182948123-1' },
      { key: 'maintenance_mode', value: 'false' }
    ];

    for (const setting of defaultSettings) {
      await client.query(`
        INSERT INTO site_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `, [setting.key, setting.value]);
    }
    console.log('Site settings table created and default settings seeded successfully.');

    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
