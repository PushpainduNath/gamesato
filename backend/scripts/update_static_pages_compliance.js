require('dotenv').config();
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://portal_admin:PortalSecure%40321@localhost:5432/gamesato?schema=public'
});

async function run() {
  console.log('Updating static_pages and site_settings with Zhoop InfoTech & active mailboxes...');

  const pages = [
    {
      slug: 'terms',
      title: 'Terms of Service',
      content: `<div>
  <p>Welcome to <strong>Gamesato</strong>, a free web gaming platform owned and operated by <strong><a href="https://zhoop.in/" target="_blank" rel="noopener noreferrer">Zhoop InfoTech</a></strong>. By accessing, browsing, or playing games on <a href="https://gamesato.com">https://gamesato.com</a>, you agree to be bound by these Terms of Service, together with our Privacy Policy.</p>
  <h2>1. Eligibility & Age Requirements</h2>
  <p>You warrant that you are at least 18 years of age or accessing under the supervision of a parent/guardian. Children under 13 may not create accounts.</p>
  <h2>2. Permitted Use & Fair Play License</h2>
  <p>Gamesato grants you a limited, non-exclusive license for personal non-commercial entertainment. Code duplication, reverse-engineering, and scraping are strictly forbidden.</p>
  <h2>3. Prohibited Conduct & Google Publisher Policy Compliance</h2>
  <p>We enforce strict adherence to Google AdSense Publisher Policies: Zero tolerance for Illegal Content, Dangerous/Derogatory content, Hacking/Cheat-tools, Phishing/Deceptive practices, Malware/Adware, and Sexually Explicit or Child Harm materials.</p>
  <h2>4. Intellectual Property Rights & DMCA</h2>
  <p>All platform code and designs are Gamesato intellectual property under Zhoop InfoTech. Featured games belong to their respective developers. DMCA inquiries: support@gamesato.com.</p>
  <h2>5. Third-Party Advertisements & Cookie Guidelines</h2>
  <p>Certified ad vendors (including Google AdSense) may serve relevant ads. Refer to Google Publisher Policies at https://support.google.com/adsense/answer/48182 and https://support.google.com/adsense/answer/10502938. Report broken ads to support@gamesato.com.</p>
  <h2>6. Governing Law & Jurisdiction</h2>
  <p>Governed by laws applicable in New Delhi, India. Exclusive jurisdiction in New Delhi, India.</p>
</div>`
    },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      content: `<div>
  <p>At <strong>Gamesato</strong> (accessible from <a href="https://gamesato.com">https://gamesato.com</a>, operated by <strong><a href="https://zhoop.in/" target="_blank" rel="noopener noreferrer">Zhoop InfoTech</a></strong>), we take your privacy seriously. Guest gameplay requires zero personal details.</p>
  <h2>1. Information We Collect</h2>
  <p>Guest favorites stored in LocalStorage. Optional account registration uses salted bcrypt hashing. Non-identifying server logs record browser/OS for diagnostics.</p>
  <h2>2. Cookies, Log Files & Advertising Technologies</h2>
  <p>We use temporary Session Cookies and persistent preference cookies. Google AdSense uses DoubleClick DART cookies for personalized ads. Opt-out at https://adssettings.google.com or www.aboutads.info.</p>
  <h2>3. Inappropriate Ad Reporting</h2>
  <p>Report any intrusive or inappropriate advertisement to support@gamesato.com for immediate removal within 24 hours.</p>
  <h2>4. GDPR, CCPA & COPPA Rights</h2>
  <p>Full rights to data access, correction, erasure, and strict COPPA compliance for children under 13.</p>
</div>`
    },
    {
      slug: 'about',
      title: 'About Us',
      content: `<div>
  <p>Welcome to <strong>Gamesato</strong>, your premier destination for instant-play HTML5 browser games with zero downloads or hardware barriers, proudly owned and operated by <strong><a href="https://zhoop.in/" target="_blank" rel="noopener noreferrer">Zhoop InfoTech</a></strong>.</p>
  <h2>Your Ultimate Web Gaming Destination</h2>
  <p>60 FPS web gaming across mobile, tablet, and desktop powered by HTML5, WebGL 2.0, and WebAssembly.</p>
  <h2>Our Diverse Game Library</h2>
  <p>Curated categories: Action & Adventure, Puzzle & Strategy, Arcade & Classics, Sports & Racing, 2-Player & Co-op, and Casual Brain Games.</p>
  <h2>Key Platform Features</h2>
  <p>Instant Browser Play, Universal Cross-Device Responsiveness, Cloud Saved Favorites, Family-Friendly Environment, and Continuous Releases.</p>
  <h2>For Game Developers & Studios</h2>
  <p>High-traffic publishing network with transparent telemetry and monetization. Submit via our Developer Portal or email hello@gamesato.com.</p>
</div>`
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      content: `<div>
  <p>We are always happy to hear from players, creators, and business partners. Gamesato is owned and operated by <strong><a href="https://zhoop.in/" target="_blank" rel="noopener noreferrer">Zhoop InfoTech</a></strong>.</p>
  <h2>Contact Departments</h2>
  <ul>
    <li><strong>Player Support & Bug Reports:</strong> support@gamesato.com</li>
    <li><strong>General Inquiries & Partnerships:</strong> hello@gamesato.com</li>
    <li><strong>Developer Relations & Game Submissions:</strong> hello@gamesato.com</li>
    <li><strong>Privacy & DMCA Notices:</strong> support@gamesato.com</li>
  </ul>
</div>`
    }
  ];

  for (const p of pages) {
    const res = await pool.query(
      `UPDATE static_pages 
       SET title = $1, content = $2, updated_at = NOW() 
       WHERE slug = $3`,
      [p.title, p.content, p.slug]
    );
    console.log(`Updated ${p.slug}: ${res.rowCount} row(s)`);
  }

  // Update site_settings support_email
  await pool.query(
    `UPDATE site_settings SET value = 'support@gamesato.com', updated_at = NOW() WHERE key = 'support_email'`
  );
  console.log('Updated site_settings support_email to support@gamesato.com');

  await pool.end();
  console.log('Database synchronization completed successfully!');
}

run().catch(err => {
  console.error('Update error:', err);
  process.exit(1);
});
