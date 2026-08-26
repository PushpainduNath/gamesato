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

const blogsData = [
  {
    title: 'Subway Surfers & Banana Kong: Ultimate Endless Runner Guide',
    slug: 'subway-surfers-banana-kong-endless-runner-guide',
    excerpt: 'Master Subway Surfers, Banana Kong, and Emoji Runner on Gamesato! Learn top endless runner high score tips, power-up tricks, and obstacle dodging.',
    category: 'Arcade',
    author: 'Pushpaindu Nath',
    status: 'published',
    published_at: '2026-08-15 10:00:00',
    cover_image: '/uploads/media/blog_1_cover.jpg',
    meta_title: 'Play Subway Surfers & Banana Kong Free Online - Gamesato',
    meta_description: 'Play Subway Surfers and Banana Kong free online in your browser! No downloads needed. Master high scores, power-ups, and endless runner tips on Gamesato.',
    content: `
      <h2>1. Subway Surfers Train Dodging & High Score Mastery</h2>
      <p>Endless runner games are the ultimate test of reflexes and rhythm. Leading the pack is the world-famous <a href="/games/subway-surfers">Subway Surfers</a>, where you control Jake as he dodges oncoming subway trains, leaps over barriers, and collects shiny gold coins. Mastering lane switching, swipe timing, and hoverboard activation during tight jams is essential to reaching the top of global leaderboards.</p>
      
      <p><img src="/uploads/media/blog_1_img1.jpg" alt="Subway Surfers Train Dodging Gameplay" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Banana Kong Jungle Gliding & Banana Dash</h2>
      <p>If you love wild jungle adventures, <a href="/games/banana-kong">Banana Kong</a> takes endless running into deep tropical rainforests. Guide Kong as he dashes through dense foliage, glides across treetops using toucans, and burrows underwater to outrun a massive banana avalanche. Collect every banana to fill your power bar and trigger destructive dashes that smash through cave barriers!</p>
      
      <p><img src="/uploads/media/blog_1_img2.jpg" alt="Banana Kong Jungle Gliding Adventure" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Emoji Runner One-Tap Reflex Challenge</h2>
      <p>For a lightweight, ultra-fast casual option, <a href="/games/emoji-runner">Emoji Runner</a> brings single-tap running fun to your browser. Control an expressive emoji avatar sprinting through dynamic 3D obstacle courses. Jump over spikes, slide beneath overhead traps, and see how far your reflexes can carry you!</p>
      
      <p><img src="/uploads/media/blog_1_img3.jpg" alt="Emoji Runner One-Tap Reflex Sprinting" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Top Power-Up & Coin Collection Strategies</h2>
      <p>To maximize your score across <a href="/games/subway-surfers">Subway Surfers</a> and <a href="/games/banana-kong">Banana Kong</a>, prioritize upgrading coin magnets, jetpacks, and score multipliers early. Always activate your hoverboard or dash ability when entering high-speed sections for temporary invincibility.</p>
      
      <p><img src="/uploads/media/blog_1_img4.jpg" alt="Endless Runner Powerups & Upgrades" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Check Out Our Amazing Game Categories!</h3>
      <ul>
        <li><a href="/category/arcade">Arcade Games</a></li>
        <li><a href="/category/action">Action Games</a></li>
        <li><a href="/category/racing">Racing Games</a></li>
        <li><a href="/category/puzzle">Puzzle Games</a></li>
        <li><a href="/category/sports">Sports Games</a></li>
      </ul>
    `
  },
  {
    title: 'Angry Birds 2 Online Guide: Slingshot Physics & High Score Tips',
    slug: 'angry-birds-2-slingshot-physics-guide',
    excerpt: 'Play Angry Birds 2, Bottle Flip 3D, and Bouncemasters free on Gamesato! Learn slingshot trajectory angles, bird powers, and physics puzzle tactics.',
    category: 'Puzzle',
    author: 'Gamesato Editorial',
    status: 'published',
    published_at: '2026-08-16 11:30:00',
    cover_image: '/uploads/media/blog_2_cover.jpg',
    meta_title: 'Angry Birds 2 Free Online Slingshot Guide - Gamesato',
    meta_description: 'Play Angry Birds 2 online free! Master slingshot trajectory, bird powers, and physics puzzles directly in your browser on Gamesato.',
    content: `
      <h2>1. Angry Birds 2 Slingshot Trajectory & Bird Powers</h2>
      <p>Physics-based puzzle games offer immense satisfaction when a single well-aimed shot causes a massive chain reaction. In <a href="/games/angry-birds-2">Angry Birds 2</a>, launch iconic birds like Red, Chuck, Bomb, and Silver using a precision slingshot to demolish bad pig fortresses. Calculate launch angles, factor in environmental wind, and activate special bird abilities mid-air to trigger colossal destruction.</p>
      
      <p><img src="/uploads/media/blog_2_img1.jpg" alt="Angry Birds 2 Slingshot Trajectory Shot" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Bottle Flip 3D Precision Jump & Balance</h2>
      <p>Test your micro-timing with <a href="/games/bottle-flip-3d-tap-jump">Bottle Flip 3D Tap & Jump</a>. Flip a water bottle across tables, chairs, shelf units, and moving appliances. Tap once for a standard flip or double-tap for a high air spin. Land safely on every surface without slipping to clear intricate 3D household rooms!</p>
      
      <p><img src="/uploads/media/blog_2_img2.jpg" alt="Bottle Flip 3D Table Landing Stunt" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Bouncemasters Penguin Launching & Upgrades</h2>
      <p>Ready for arctic madness? In <a href="/games/bouncemasters-penguin-games">Bouncemasters Penguin Games</a>, control a polar bear swinging a baseball bat to launch a cute penguin across snowy ice fields. Bounce off seals, walruses, and mushroom cushions to gain air momentum and travel thousands of meters!</p>
      
      <p><img src="/uploads/media/blog_2_img3.jpg" alt="Bouncemasters Polar Bear Penguin Launch" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Physics-Based Puzzle Solving Strategies</h2>
      <p>In games like <a href="/games/angry-birds-2">Angry Birds 2</a>, aim for structural support beams made of glass or dynamite barrels rather than solid stone blocks. One key hit to the foundation brings down entire multi-story towers in seconds.</p>
      
      <p><img src="/uploads/media/blog_2_img4.jpg" alt="Physics Puzzle Chain Reaction Destruction" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Explore Our Amazing Games!</h3>
      <ul>
        <li><a href="/games/angry-birds-2">Angry Birds 2</a></li>
        <li><a href="/games/bottle-flip-3d-tap-jump">Bottle Flip 3D Tap & Jump</a></li>
        <li><a href="/games/bouncemasters-penguin-games">Bouncemasters Penguin Games</a></li>
        <li><a href="/games/subway-surfers">Subway Surfers</a></li>
      </ul>
    `
  },
  {
    title: 'Johnny Trigger & Stick War: Top Free Action & Shooting Games',
    slug: 'johnny-trigger-stick-war-action-shooting-games',
    excerpt: 'Step into combat with Johnny Trigger, Stick War, and Ball Blast on Gamesato! Master slow-mo flip shooting, army tactics, and heavy cannon upgrades.',
    category: 'Action',
    author: 'Pushpaindu Nath',
    status: 'published',
    published_at: '2026-08-17 09:15:00',
    cover_image: '/uploads/media/blog_3_cover.jpg',
    meta_title: 'Play Johnny Trigger & Stick War Free Online - Gamesato',
    meta_description: 'Experience fast-paced action! Play Johnny Trigger and Stick War free online in your web browser. No download required on Gamesato.',
    content: `
      <h2>1. Johnny Trigger Slow-Motion Flip Shooting Mastery</h2>
      <p>If you love slick, cinematic action, <a href="/games/johnny-trigger-action-shooter">Johnny Trigger Action Shooter</a> puts you in the suit of an unstoppable covert agent. As Johnny somersaults through the air in slow motion, time your gunshots perfectly to take down mafia goons before your jump finishes. One missed bullet means retry, so absolute precision is key!</p>
      
      <p><img src="/uploads/media/blog_3_img1.jpg" alt="Johnny Trigger Slow Motion Flip Shooting" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Stick War Battalion Strategy & Army Conquest</h2>
      <p>Take command of legendary stick armies in <a href="/games/stick-war">Stick War</a>. Mine precious gold, train archers, spearmen, swordwrath, and giant units to defend your statue while invading enemy territories. Balance resource management with frontline tactical combat to conquer the continent of Inamorta.</p>
      
      <p><img src="/uploads/media/blog_3_img2.jpg" alt="Stick War Army Battalion Battle" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Ball Blast Cannon Upgrades & Boulder Blasting</h2>
      <p>Blast giant numbered boulders before they crush your ship in <a href="/games/ball-blast-cannon-blitz-mania">Ball Blast Cannon Blitz Mania</a>. Upgrade cannon fire rate, blast power, and coins multiplier to split massive rocks into smaller targets and clear high-speed waves.</p>
      
      <p><img src="/uploads/media/blog_3_img3.jpg" alt="Ball Blast Cannon Blasting Boulders" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Mastering Reflexes in Browser Action Games</h2>
      <p>Action titles on Gamesato like <a href="/games/johnny-trigger-action-shooter">Johnny Trigger</a> require split-second timing. Stay calm during chaotic boss encounters, observe enemy patrol patterns, and upgrade your weaponry frequently.</p>
      
      <p><img src="/uploads/media/blog_3_img4.jpg" alt="Browser Action Shooter Boss Fight" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Check Out Our Amazing Game Categories!</h3>
      <ul>
        <li><a href="/category/action">Action Games</a></li>
        <li><a href="/category/arcade">Arcade Games</a></li>
        <li><a href="/category/racing">Racing Games</a></li>
        <li><a href="/category/puzzle">Puzzle Games</a></li>
      </ul>
    `
  },
  {
    title: 'Bounce Tales & Seashine: Magical Physics Platformer Adventures',
    slug: 'bounce-tales-seashine-adventure-platformers',
    excerpt: 'Relive classic Bounce Tales Nokia nostalgia and explore dark ocean caves in Seashine! Discover top physics adventure platformers free on Gamesato.',
    category: 'Adventure',
    author: 'Gamesato Editorial',
    status: 'published',
    published_at: '2026-08-18 14:00:00',
    cover_image: '/uploads/media/blog_4_cover.jpg',
    meta_title: 'Play Bounce Tales & Seashine Free Online - Gamesato',
    meta_description: 'Relive Nokia nostalgia! Play Bounce Tales and Seashine free online in your web browser. Explore platformer adventures on Gamesato.',
    content: `
      <h2>1. Bounce Tales Nokia Nostalgic Physics Platformer</h2>
      <p>Relive childhood gaming memories with <a href="/games/bounce-tales">Bounce Tales</a>! Originally famous on classic Nokia mobile devices, this physics-based platform adventure lets you roll, bounce, and transform a cute red bouncy ball through vibrant green hills, dark caverns, and puzzle-filled landscapes. Solve button switches, avoid sharp wooden spikes, and defeat evil cube monsters.</p>
      
      <p><img src="/uploads/media/blog_4_img1.jpg" alt="Bounce Tales Red Ball Rolling in Green Hills" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Seashine Underwater Glowing Jellyfish Survival</h2>
      <p>Submerge into an atmospheric abyssal ocean with <a href="/games/seashine">Seashine</a>. Guide a tiny bioluminescent jellyfish through dark underwater caverns. Collect light sources to prevent your glow from fading, dodge predatory anglerfish, giant crabs, and sea serpents, and discover hidden glowing ruins.</p>
      
      <p><img src="/uploads/media/blog_4_img2.jpg" alt="Seashine Glowing Jellyfish Underwater Exploration" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Bullet Boy Sky Cannon Blast Adventures</h2>
      <p>Launch through the sky in <a href="/games/bullet-boy">Bullet Boy</a>! Blast your helmeted hero from cannon to cannon while avoiding spinning windmill blades, birds, and floating obstacles in fast-paced aerial arcade levels.</p>
      
      <p><img src="/uploads/media/blog_4_img3.jpg" alt="Bullet Boy Cannon Launching Sky Adventure" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Exploring Hidden Secrets in Web Platformers</h2>
      <p>Both <a href="/games/bounce-tales">Bounce Tales</a> and <a href="/games/seashine">Seashine</a> reward thorough exploration. Look out for cracked walls, hidden light crystals, and secret exits to complete levels with 100% rating.</p>
      
      <p><img src="/uploads/media/blog_4_img4.jpg" alt="Platformer Game Secret Treasures and Crystals" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Explore Our Amazing Games!</h3>
      <ul>
        <li><a href="/games/bounce-tales">Bounce Tales</a></li>
        <li><a href="/games/seashine">Seashine</a></li>
        <li><a href="/games/bullet-boy">Bullet Boy</a></li>
        <li><a href="/games/subway-surfers">Subway Surfers</a></li>
      </ul>
    `
  },
  {
    title: 'Hoop World & Mountain Bike Xtreme: Extreme Sports & Stunts Guide',
    slug: 'hoop-world-mountain-bike-xtreme-sports-games',
    excerpt: 'Perform spectacular basketball dunks in Hoop World and conquer steep mountain trails in Mountain Bike Xtreme free on Gamesato!',
    category: 'Sports',
    author: 'Pushpaindu Nath',
    status: 'published',
    published_at: '2026-08-19 10:45:00',
    cover_image: '/uploads/media/blog_5_cover.jpg',
    meta_title: 'Play Hoop World & Mountain Bike Xtreme Online - Gamesato',
    meta_description: 'Perform epic dunks and bike stunts! Play Hoop World and Mountain Bike Xtreme free online directly in your browser on Gamesato.',
    content: `
      <h2>1. Hoop World Acrobatic Slam Dunk Flips</h2>
      <p>Soar high above the basketball court in <a href="/games/hoop-world">Hoop World</a>! Combine trampoline jumping, frontflips, backflips, and aerial rotations to slam dunk the basketball into the hoop with maximum style points. Time your jump release perfectly to avoid missing the basket!</p>
      
      <p><img src="/uploads/media/blog_5_img1.jpg" alt="Hoop World Acrobatic Slam Dunk" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Mountain Bike Xtreme Downhill Trail Balancing</h2>
      <p>Conquer rugged mountain peaks in <a href="/games/mountain-bike-xtreme">Mountain Bike Xtreme</a>. Balance your bike over steep inclines, rocky drops, and wooden ramps. Master front and rear weight distribution to execute flawless jumps without crashing your rider.</p>
      
      <p><img src="/uploads/media/blog_5_img2.jpg" alt="Mountain Bike Xtreme Downhill Stunts" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Head Soccer 2026 Arcade Penalty Battles</h2>
      <p>Enjoy hilarious 1-on-1 soccer action in <a href="/games/head-soccer-2026">Head Soccer 2026</a>! Control big-headed football stars, kick super-shots, use icy freezes or fireballs, and score goals against rival players.</p>
      
      <p><img src="/uploads/media/blog_5_img3.jpg" alt="Head Soccer 2026 Big Head Penalty Match" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Winning Tournament Trophies on Gamesato</h2>
      <p>Whether you are dunking in <a href="/games/hoop-world">Hoop World</a> or racing in <a href="/games/mountain-bike-xtreme">Mountain Bike Xtreme</a>, practice rhythm timing to rack up massive trick multipliers.</p>
      
      <p><img src="/uploads/media/blog_5_img4.jpg" alt="Sports Game Stunt Multipliers and Trophies" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Check Out Our Amazing Game Categories!</h3>
      <ul>
        <li><a href="/category/sports">Sports Games</a></li>
        <li><a href="/category/racing">Racing Games</a></li>
        <li><a href="/category/action">Action Games</a></li>
        <li><a href="/category/arcade">Arcade Games</a></li>
      </ul>
    `
  },
  {
    title: 'Solitaire 2048 & Number Snake: Brain-Boosting Card & Logic Puzzles',
    slug: 'solitaire-2048-number-snake-puzzle-logic-games',
    excerpt: 'Challenge your brain with Solitaire 2048, Number Snake, and Cut The Candy on Gamesato! Master card merging, number grid clearing, and rope logic.',
    category: 'Puzzle',
    author: 'Gamesato Editorial',
    status: 'published',
    published_at: '2026-08-20 16:20:00',
    cover_image: '/uploads/media/blog_6_cover.jpg',
    meta_title: 'Solitaire 2048 & Number Snake Free Online - Gamesato',
    meta_description: 'Train your brain with Solitaire 2048 and Number Snake! Merge cards, clear grid blocks, and solve free logic puzzles on Gamesato.',
    content: `
      <h2>1. Solitaire 2048 Card Merging & Stack Strategy</h2>
      <p>What happens when you mix classic Solitaire card play with the addictive math of 2048? You get <a href="/games/solitaire-2048">Solitaire 2048</a>! Drop cards onto four columns to merge identical values (2+2=4, 4+4=8, 512+512=1024) until you form the legendary 2048 card. Plan card placement to avoid overflowing your columns!</p>
      
      <p><img src="/uploads/media/blog_6_img1.jpg" alt="Solitaire 2048 Card Merging Gameplay" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Number Snake Grid Navigation & Block Breaking</h2>
      <p>Navigate a growing snake through numbered blocks in <a href="/games/number-snake">Number Snake</a>. Collect numbered balls to increase your snake size, and choose which numbered block barriers to smash through to survive the grid board.</p>
      
      <p><img src="/uploads/media/blog_6_img2.jpg" alt="Number Snake Grid Block Clearing" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Cut The Candy Rope Slicing Logic</h2>
      <p>Solve sweet physics challenges in <a href="/games/cut-the-candy">Cut The Candy</a>! Slice ropes at exact moments to drop delicious candies into the cute monster mouth while avoiding spikes and collecting golden stars.</p>
      
      <p><img src="/uploads/media/blog_6_img3.jpg" alt="Cut The Candy Rope Slicing Physics" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Cognitive Benefits of Daily Puzzle Gaming</h2>
      <p>Playing logic games like <a href="/games/solitaire-2048">Solitaire 2048</a> daily enhances mental calculation speed, pattern recognition, and short-term memory.</p>
      
      <p><img src="/uploads/media/blog_6_img4.jpg" alt="Brain Puzzle Completion Star Rewards" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Explore Our Amazing Games!</h3>
      <ul>
        <li><a href="/games/solitaire-2048">Solitaire 2048</a></li>
        <li><a href="/games/number-snake">Number Snake</a></li>
        <li><a href="/games/cut-the-candy">Cut The Candy</a></li>
        <li><a href="/games/angry-birds-2">Angry Birds 2</a></li>
      </ul>
    `
  },
  {
    title: 'Paint Hide & Seek: Stealth, Camouflage & Tactics Guide',
    slug: 'paint-hide-seek-stealth-color-matching-guide',
    excerpt: 'Master camouflage in Paint Hide & Seek, test ball reflexes in Color Road, and survive Wave Run free online on Gamesato!',
    category: 'Puzzle',
    author: 'Pushpaindu Nath',
    status: 'published',
    published_at: '2026-08-21 11:00:00',
    cover_image: '/uploads/media/blog_7_cover.jpg',
    meta_title: 'Paint Hide & Seek & Color Road Free Online - Gamesato',
    meta_description: 'Master stealth camouflage in Paint Hide & Seek! Play color matching and stealth games free online in your browser on Gamesato.',
    content: `
      <h2>1. Paint Hide & Seek Color Blending Stealth Tactics</h2>
      <p>Step into an intense game of hide-and-seek with a colorful twist in <a href="/games/paint-hide-seek">Paint Hide & Seek</a>! Play as a hider blending into painted walls by matching exact colors, or play as a seeker searching rooms to spot disguised players before time expires.</p>
      
      <p><img src="/uploads/media/blog_7_img1.jpg" alt="Paint Hide & Seek Camouflage Gameplay" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Color Road 3D Ball Color Matching Ramps</h2>
      <p>Roll down a high-speed winding track in <a href="/games/color-road">Color Road</a>! Steer your rolling ball to collide only with spheres matching your current color. Hitting a different color ball ends your run instantly, so stay focused as color-changing ramps shift your ball hue!</p>
      
      <p><img src="/uploads/media/blog_7_img2.jpg" alt="Color Road Ball Rolling Track" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Wave Run Neon Ship Reflex Obstacles</h2>
      <p>Survive a high-speed neon cyber world in <a href="/games/wave-run">Wave Run</a>! Hold to fly upwards and release to drop downward as your glowing ship weaves past deadly triangular spikes and moving obstacles.</p>
      
      <p><img src="/uploads/media/blog_7_img3.jpg" alt="Wave Run Neon Ship Flying Obstacles" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. How to Outsmart Opponents in Stealth Puzzles</h2>
      <p>In <a href="/games/paint-hide-seek">Paint Hide & Seek</a>, change your paint color ahead of time and stand still right when seekers walk past your location for maximum camouflage effect!</p>
      
      <p><img src="/uploads/media/blog_7_img4.jpg" alt="Stealth Puzzle Victory Splashes" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Check Out Our Amazing Game Categories!</h3>
      <ul>
        <li><a href="/category/puzzle">Puzzle Games</a></li>
        <li><a href="/category/arcade">Arcade Games</a></li>
        <li><a href="/category/action">Action Games</a></li>
        <li><a href="/category/sports">Sports Games</a></li>
      </ul>
    `
  },
  {
    title: 'Bike Up & Subway Riders: Master High-Speed Obstacle & Speed Challenges',
    slug: 'bike-up-subway-riders-speed-obstacle-challenges',
    excerpt: 'Ride stunt bikes in Bike Up and race subway tracks in Subway Riders free on Gamesato! Master motorcycle balancing and high-speed reflexes.',
    category: 'Racing',
    author: 'Gamesato Editorial',
    status: 'published',
    published_at: '2026-08-22 13:30:00',
    cover_image: '/uploads/media/blog_8_cover.jpg',
    meta_title: 'Play Bike Up & Subway Riders Free Online - Gamesato',
    meta_description: 'Test your reflexes! Play Bike Up and Wave Run free online. Balance stunt bikes and survive neon obstacle tracks on Gamesato.',
    content: `
      <h2>1. Bike Up Precision Trials Motorcycle Balancing</h2>
      <p>Throttle up and tackle dangerous obstacle courses in <a href="/games/bike-up">Bike Up</a>! Balance your stunt bike over giant wooden crates, circular loops, moving platforms, and spike traps. Lean forward and backward to land dangerous jumps on both wheels.</p>
      
      <p><img src="/uploads/media/blog_8_img1.jpg" alt="Bike Up Stunt Motorcycle Balancing" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Subway Riders High-Speed Track Dodging</h2>
      <p>Hit top gear in <a href="/games/subway-riders">Subway Riders</a>! Race along subway tracks, dodge oncoming trains, collect boost pickups, and set record speeds across urban transit routes.</p>
      
      <p><img src="/uploads/media/blog_8_img2.jpg" alt="Subway Riders High Speed Racing Track" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Wave Run High-Speed Neon Survival</h2>
      <p>Reflex speed meets futuristic synthwave visuals in <a href="/games/wave-run">Wave Run</a>. Keep your wave ship centered between upper and lower danger zones while racing at insane speeds.</p>
      
      <p><img src="/uploads/media/blog_8_img3.jpg" alt="Wave Run High Speed Neon Survival" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Upgrading Vehicles for Maximum Speed</h2>
      <p>Earn coins in <a href="/games/bike-up">Bike Up</a> to upgrade your bike acceleration, grip tires, and shock absorbers for smooth landings on tough levels.</p>
      
      <p><img src="/uploads/media/blog_8_img4.jpg" alt="Motorcycle Custom Garage Upgrades" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Explore Our Amazing Games!</h3>
      <ul>
        <li><a href="/games/bike-up">Bike Up</a></li>
        <li><a href="/games/subway-riders">Subway Riders</a></li>
        <li><a href="/games/wave-run">Wave Run</a></li>
        <li><a href="/games/subway-surfers">Subway Surfers</a></li>
      </ul>
    `
  },
  {
    title: 'The Nostalgia Revival: Playing Classic Mobile Remakes Online Free',
    slug: 'nostalgia-revival-classic-mobile-games-browser',
    excerpt: 'Relive mobile gaming legends! Play Bounce Tales, Subway Surfers, and Angry Birds 2 directly in your browser free on Gamesato.',
    category: 'Guides',
    author: 'Pushpaindu Nath',
    status: 'published',
    published_at: '2026-08-23 15:45:00',
    cover_image: '/uploads/media/blog_9_cover.jpg',
    meta_title: 'Play Classic Mobile & Nokia Games Online Free - Gamesato',
    meta_description: 'Relive your favorite mobile classics! Play Bounce Tales, Subway Surfers, and Angry Birds 2 free online without downloads on Gamesato.',
    content: `
      <h2>1. The Nokia Era: Bounce Tales Red Ball Legend</h2>
      <p>Before smartphones existed, millions played <a href="/games/bounce-tales">Bounce Tales</a> on classic Nokia button phones. Today, experience the exact same red bouncy ball physics adventure running smoothly at 60FPS in your modern browser on Gamesato!</p>
      
      <p><img src="/uploads/media/blog_9_img1.jpg" alt="Classic Nokia Bounce Tales Red Ball Game" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Mobile Runner Era: Subway Surfers Phenomenon</h2>
      <p>Relive the early smartphone golden age with <a href="/games/subway-surfers">Subway Surfers</a>. Experience the iconic train surfing gameplay with zero app store installs or storage consumption.</p>
      
      <p><img src="/uploads/media/blog_9_img2.jpg" alt="Subway Surfers Mobile Classic Gameplay" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Slingshot Physics Era: Angry Birds 2 Revolution</h2>
      <p>Smash pig fortresses with <a href="/games/angry-birds-2">Angry Birds 2</a>! The classic slingshot mechanics that defined mobile gaming are now available instantly on desktop and mobile web on Gamesato.</p>
      
      <p><img src="/uploads/media/blog_9_img3.jpg" alt="Angry Birds 2 Slingshot Classic Destruction" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Why Playing Retro Mobile Hits in Browsers Is Better</h2>
      <p>Web versions of <a href="/games/bounce-tales">Bounce Tales</a> and <a href="/games/subway-surfers">Subway Surfers</a> load instantly without taking up smartphone storage space or requiring app permissions.</p>
      
      <p><img src="/uploads/media/blog_9_img4.jpg" alt="Instant Web Browser vs Mobile App Install Comparison" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Check Out Our Amazing Game Categories!</h3>
      <ul>
        <li><a href="/category/arcade">Arcade Games</a></li>
        <li><a href="/category/adventure">Adventure Games</a></li>
        <li><a href="/category/puzzle">Puzzle Games</a></li>
        <li><a href="/category/sports">Sports Games</a></li>
      </ul>
    `
  },
  {
    title: 'Top 5 Casual Arcade Games for Quick 5-Minute Break Sessions',
    slug: 'top-casual-arcade-games-quick-break-sessions',
    excerpt: 'Need a quick 5-minute study or office break? Play Emoji Runner, Bottle Flip 3D, and Ball Blast instant arcade games free on Gamesato.',
    category: 'Arcade',
    author: 'Gamesato Editorial',
    status: 'published',
    published_at: '2026-08-24 10:15:00',
    cover_image: '/uploads/media/blog_10_cover.jpg',
    meta_title: 'Best Quick 5-Minute Browser Games - Gamesato',
    meta_description: 'Need a quick study or work break? Play top casual 5-minute browser games like Bottle Flip 3D and Emoji Runner free on Gamesato.',
    content: `
      <h2>1. Emoji Runner Quick One-Tap Sprinting</h2>
      <p>When you have a quick 5-minute break, <a href="/games/emoji-runner">Emoji Runner</a> provides instant casual fun. One tap jumps over obstacles as your smiley emoji sprints along colorful paths.</p>
      
      <p><img src="/uploads/media/blog_10_img1.jpg" alt="Emoji Runner Quick 5 Minute Break Session" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Bottle Flip 3D Upright Landing Tricks</h2>
      <p>Flip bottles onto tables and shelves with <a href="/games/bottle-flip-3d-tap-jump">Bottle Flip 3D Tap & Jump</a>. Simple single-tap timing makes it the perfect stress buster during work breaks.</p>
      
      <p><img src="/uploads/media/blog_10_img2.jpg" alt="Bottle Flip 3D Casual Room Stunts" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Ball Blast Bounding Boulder Cannon Destruction</h2>
      <p>Blast bouncing numbered rocks in <a href="/games/ball-blast-cannon-blitz-mania">Ball Blast Cannon Blitz Mania</a>. High-octane shooting and quick waves make it ideal for short gaming sessions.</p>
      
      <p><img src="/uploads/media/blog_10_img3.jpg" alt="Ball Blast Cannon Boulders Shooting" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. How 5-Minute Game Breaks Refresh Your Mind</h2>
      <p>Taking short 5-minute gaming breaks on <a href="/games/emoji-runner">Gamesato</a> helps relieve eye strain, refreshes cognitive focus, and boosts overall productivity.</p>
      
      <p><img src="/uploads/media/blog_10_img4.jpg" alt="Quick Gaming Break Productivity Refresh" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Explore Our Amazing Games!</h3>
      <ul>
        <li><a href="/games/emoji-runner">Emoji Runner</a></li>
        <li><a href="/games/bottle-flip-3d-tap-jump">Bottle Flip 3D Tap & Jump</a></li>
        <li><a href="/games/ball-blast-cannon-blitz-mania">Ball Blast Cannon Blitz Mania</a></li>
        <li><a href="/games/subway-surfers">Subway Surfers</a></li>
      </ul>
    `
  },
  {
    title: 'Gamesato Complete Player Guide: Discover Your Next Favorite Game',
    slug: 'gamesato-complete-player-guide-discover-games',
    excerpt: 'Explore all 20+ free online HTML5 games on Gamesato! Discover Subway Surfers, Angry Birds 2, Bounce Tales, Johnny Trigger, Seashine, and more.',
    category: 'Gaming News',
    author: 'Pushpaindu Nath',
    status: 'published',
    published_at: '2026-08-25 12:00:00',
    cover_image: '/uploads/media/blog_11_cover.jpg',
    meta_title: 'Best Free Online HTML5 Games Portal (2026) - Gamesato',
    meta_description: 'Play the best free online HTML5 games on Gamesato. Explore Subway Surfers, Angry Birds 2, Bounce Tales, Johnny Trigger, and 20+ top titles!',
    content: `
      <h2>1. Top Arcade & Endless Runner Games on Gamesato</h2>
      <p>Welcome to Gamesato! If you love high-speed endless running, play <a href="/games/subway-surfers">Subway Surfers</a>, <a href="/games/banana-kong">Banana Kong</a>, and <a href="/games/emoji-runner">Emoji Runner</a> instantly in your browser.</p>
      
      <p><img src="/uploads/media/blog_11_img1.jpg" alt="Gamesato Arcade and Endless Runner Games Showcase" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>2. Best Action & Shooting Browser Games</h2>
      <p>Looking for combat and army warfare? Dive into slow-mo flips with <a href="/games/johnny-trigger-action-shooter">Johnny Trigger Action Shooter</a> or command stickmen armies in <a href="/games/stick-war">Stick War</a>.</p>
      
      <p><img src="/uploads/media/blog_11_img2.jpg" alt="Gamesato Action and Shooting Games Showcase" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>3. Mind-Bending Puzzle & Strategy Challenges</h2>
      <p>Challenge your brain with slingshot destruction in <a href="/games/angry-birds-2">Angry Birds 2</a>, card merging in <a href="/games/solitaire-2048">Solitaire 2048</a>, and stealth color matching in <a href="/games/paint-hide-seek">Paint Hide & Seek</a>.</p>
      
      <p><img src="/uploads/media/blog_11_img3.jpg" alt="Gamesato Puzzle and Strategy Games Showcase" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>
      
      <h2>4. Extreme Sports, Racing & Adventure Journeys</h2>
      <p>Perform slam dunks in <a href="/games/hoop-world">Hoop World</a>, scale downhill cliffs in <a href="/games/mountain-bike-xtreme">Mountain Bike Xtreme</a>, roll with <a href="/games/bounce-tales">Bounce Tales</a>, and explore deep ocean caves in <a href="/games/seashine">Seashine</a>!</p>
      
      <p><img src="/uploads/media/blog_11_img4.jpg" alt="Gamesato Sports Racing and Adventure Games Showcase" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin: 1.5rem 0;" /></p>

      <h3>Check Out Our Amazing Game Categories!</h3>
      <ul>
        <li><a href="/category/arcade">Arcade Games</a></li>
        <li><a href="/category/action">Action Games</a></li>
        <li><a href="/category/puzzle">Puzzle Games</a></li>
        <li><a href="/category/sports">Sports Games</a></li>
        <li><a href="/category/racing">Racing Games</a></li>
        <li><a href="/category/adventure">Adventure Games</a></li>
      </ul>
    `
  }
];

async function seedBlogs() {
  try {
    await client.connect();
    console.log('Connected to database successfully!');

    // First delete any previous blogs with old slugs
    await client.query('TRUNCATE blogs RESTART IDENTITY;');

    for (const blog of blogsData) {
      const query = `
        INSERT INTO blogs (
          title, slug, excerpt, content, cover_image, category, author, status, meta_title, meta_description, published_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, CURRENT_TIMESTAMP
        );
      `;

      await client.query(query, [
        blog.title,
        blog.slug,
        blog.excerpt,
        blog.content,
        blog.cover_image,
        blog.category,
        blog.author,
        blog.status,
        blog.meta_title,
        blog.meta_description,
        blog.published_at
      ]);

      console.log(`Seeded blog with /uploads/media/ images: "${blog.title}" (${blog.published_at})`);
    }

    console.log('All 11 Game-Specific SEO blogs seeded with /uploads/media/ images successfully!');
    await client.end();
  } catch (err) {
    console.error('Error seeding blogs:', err);
    process.exit(1);
  }
}

seedBlogs();
