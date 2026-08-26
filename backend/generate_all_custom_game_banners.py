import os
from PIL import Image, ImageDraw, ImageFilter

THUMB_DIR = '/Users/pushpaindunath/Desktop/Dont-Touch/projects/gamesato/backend/uploads/thumbnails'
MEDIA_DIR = '/Users/pushpaindunath/Desktop/Dont-Touch/projects/gamesato/backend/uploads/media'

# Map game slugs to thumbnail filename patterns
GAME_THUMBS = {
  'subway-surfers': 'subway-surfers-1785664432443.jpg',
  'subway-surfers-alt': 'subway-surfers-1785664432445.jpg',
  'banana-kong': 'banana-kong-1785665023318.jpg',
  'banana-kong-alt': 'banana-kong-1785665023320.jpg',
  'angry-birds-2': 'angry-birds-2-1785667599567.jpg',
  'angry-birds-2-alt': 'angry-birds-2-1785667599568.jpg',
  'bounce-tales': 'bounce-tales-1785665260288.jpg',
  'bounce-tales-alt': 'bounce-tales-1785665260289.jpg',
  'johnny-trigger': 'johnny-trigger-action-shooter-1785742219480.jpg',
  'johnny-trigger-alt': 'johnny-trigger-action-shooter-1785742219481.jpg',
  'seashine': 'seashine-1785667833838.jpg',
  'seashine-alt': 'seashine-1785667833839.jpg',
  'hoop-world': 'hoop-world-1786001362759.avif',
  'hoop-world-alt': 'hoop-world-1786001362762.avif',
  'mountain-bike': 'mountain-bike-xtreme-1785667059340.jpg',
  'mountain-bike-alt': 'mountain-bike-xtreme-1785667059341.jpg',
  'solitaire-2048': 'solitaire-2048-1785732293602.png',
  'solitaire-2048-alt': 'solitaire-2048-1785732293604.png',
  'paint-hide-seek': 'paint-hide-seek-1786095194239.webp',
  'paint-hide-seek-alt': 'paint-hide-seek-1786095194241.webp',
  'bike-up': 'bike-up-1785741437213.jpg',
  'bike-up-alt': 'bike-up-1785741437214.jpg',
  'stick-war': 'stick-war-1785642065096.jpg',
  'stick-war-alt': 'stick-war-1785642065097.jpg',
  'bottle-flip-3d': 'bottle-flip-3d-tap-jump-1785741743445.jpg',
  'bottle-flip-3d-alt': 'bottle-flip-3d-tap-jump-1785741743446.jpg',
  'bouncemasters': 'bouncemasters-penguin-games-1785742432932.jpg',
  'bullet-boy': 'bullet-boy-1785742781847.jpg',
  'emoji-runner': 'emoji-runner-1786711056823.png',
  'emoji-runner-alt': 'emoji-runner-1786711056825.png',
  'head-soccer-2026': 'head-soccer-2026-1781976396600.png',
  'number-snake': 'number-snake-1785733700881.png',
  'number-snake-alt': 'number-snake-1785733700882.png',
  'subway-riders': 'subway-riders-1785075422915.png',
  'wave-run': 'wave-run-1785733383250.png',
  'wave-run-alt': 'wave-run-1785732912192.png',
  'color-road': 'https-www-madkidgames-com-game-color-road-1785668996769.jpg',
  'cut-the-candy': 'cut-the-candy-1781974319709.png',
  'ball-blast': 'ball-blast-cannon-blitz-mania-1785665761110.jpg'
}

def get_thumb_path(key):
  filename = GAME_THUMBS.get(key)
  if not filename:
    return None
  path = os.path.join(THUMB_DIR, filename)
  if os.path.exists(path):
    return path
  return None

def draw_card(base, icon_path, size, pos, border_color=(45, 212, 191, 255)):
  if not icon_path or not os.path.exists(icon_path):
    return
  try:
    icon = Image.open(icon_path).convert('RGBA')
    icon = icon.resize((size, size), Image.Resampling.LANCZOS)
    
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((0, 0, size, size), radius=28, fill=255)
    
    border_padding = 16
    card_size = size + border_padding
    card = Image.new('RGBA', (card_size, card_size), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card)
    card_draw.rounded_rectangle((0, 0, card_size, card_size), radius=32, fill=border_color)
    
    card.paste(icon, (border_padding // 2, border_padding // 2), mask)
    base.paste(card, pos, card)
  except Exception as e:
    print(f"Card error for {icon_path}: {e}")

def create_custom_graphic(bg_key, main_key, sec_key, output_filename, category_tag="GAMESATO"):
  width, height = 1200, 675
  output_path = os.path.join(MEDIA_DIR, output_filename)
  
  # Base dark background
  base = Image.new('RGB', (width, height), (12, 18, 34))
  
  # Blurred atmospheric background
  bg_path = get_thumb_path(bg_key) or get_thumb_path(main_key)
  if bg_path:
    try:
      bg_img = Image.open(bg_path).convert('RGB')
      bg_img = bg_img.resize((width, height), Image.Resampling.LANCZOS)
      bg_img = bg_img.filter(ImageFilter.GaussianBlur(35))
      dark_overlay = Image.new('RGB', (width, height), (5, 10, 20))
      base = Image.blend(bg_img, dark_overlay, 0.6)
    except Exception as e:
      print(f"BG error: {e}")

  # Draw accent diagonal graphic bars
  draw = ImageDraw.Draw(base)
  draw.polygon([(0, 0), (400, 0), (100, height), (0, height)], fill=(20, 184, 166, 40))
  draw.polygon([(width-400, 0), (width, 0), (width, height), (width-100, height)], fill=(2, 132, 199, 40))

  # Main Card (Left)
  main_path = get_thumb_path(main_key)
  if main_path:
    draw_card(base, main_path, 360, (140, 155), border_color=(45, 212, 191, 255))
    
  # Secondary Card (Right)
  sec_path = get_thumb_path(sec_key)
  if sec_path:
    draw_card(base, sec_path, 320, (700, 175), border_color=(245, 158, 11, 255))

  # Category Pill Badge Top-Center
  badge_w, badge_h = 240, 50
  badge_x, badge_y = (width - badge_w) // 2, 40
  draw.rounded_rectangle((badge_x, badge_y, badge_x + badge_w, badge_y + badge_h), radius=25, fill=(20, 184, 166), outline=(45, 212, 191), width=2)
  draw.text((badge_x + 40, badge_y + 15), f"GAMESATO • {category_tag}", fill=(255, 255, 255))

  # Save Output Image
  base.save(output_path, quality=95)
  print(f"Generated custom composite graphic: {output_filename}")

# Generate all 55 custom images for 11 blogs
def generate_all():
  blogs_config = [
    # Blog 1: Subway Surfers & Banana Kong
    {
      'cover': ('subway-surfers', 'subway-surfers', 'banana-kong', 'blog_1_cover.jpg', 'ARCADE'),
      'img1': ('subway-surfers', 'subway-surfers', 'subway-surfers-alt', 'blog_1_img1.jpg', 'RUNNER'),
      'img2': ('banana-kong', 'banana-kong', 'banana-kong-alt', 'blog_1_img2.jpg', 'JUNGLE'),
      'img3': ('emoji-runner', 'emoji-runner', 'subway-surfers', 'blog_1_img3.jpg', 'REFLEX'),
      'img4': ('banana-kong', 'banana-kong', 'emoji-runner', 'blog_1_img4.jpg', 'POWERUPS'),
    },
    # Blog 2: Angry Birds 2 & Physics
    {
      'cover': ('angry-birds-2', 'angry-birds-2', 'bottle-flip-3d', 'blog_2_cover.jpg', 'PUZZLE'),
      'img1': ('angry-birds-2', 'angry-birds-2', 'angry-birds-2-alt', 'blog_2_img1.jpg', 'SLINGSHOT'),
      'img2': ('bottle-flip-3d', 'bottle-flip-3d', 'bottle-flip-3d-alt', 'blog_2_img2.jpg', 'PHYSICS'),
      'img3': ('bouncemasters', 'bouncemasters', 'angry-birds-2', 'blog_2_img3.jpg', 'LAUNCH'),
      'img4': ('bottle-flip-3d', 'bottle-flip-3d', 'bouncemasters', 'blog_2_img4.jpg', 'CHAINS'),
    },
    # Blog 3: Johnny Trigger & Stick War
    {
      'cover': ('johnny-trigger', 'johnny-trigger', 'stick-war', 'blog_3_cover.jpg', 'ACTION'),
      'img1': ('johnny-trigger', 'johnny-trigger', 'johnny-trigger-alt', 'blog_3_img1.jpg', 'SLOWMO'),
      'img2': ('stick-war', 'stick-war', 'stick-war-alt', 'blog_3_img2.jpg', 'STRATEGY'),
      'img3': ('ball-blast', 'ball-blast', 'johnny-trigger', 'blog_3_img3.jpg', 'CANNON'),
      'img4': ('johnny-trigger', 'johnny-trigger', 'ball-blast', 'blog_3_img4.jpg', 'BOSS FIGHT'),
    },
    # Blog 4: Bounce Tales & Seashine
    {
      'cover': ('bounce-tales', 'bounce-tales', 'seashine', 'blog_4_cover.jpg', 'ADVENTURE'),
      'img1': ('bounce-tales', 'bounce-tales', 'bounce-tales-alt', 'blog_4_img1.jpg', 'PLATFORMER'),
      'img2': ('seashine', 'seashine', 'seashine-alt', 'blog_4_img2.jpg', 'OCEAN'),
      'img3': ('bullet-boy', 'bullet-boy', 'bounce-tales', 'blog_4_img3.jpg', 'SKY LAUNCH'),
      'img4': ('seashine', 'seashine', 'bullet-boy', 'blog_4_img4.jpg', 'SECRETS'),
    },
    # Blog 5: Hoop World & Mountain Bike Xtreme
    {
      'cover': ('hoop-world', 'hoop-world', 'mountain-bike', 'blog_5_cover.jpg', 'SPORTS'),
      'img1': ('hoop-world', 'hoop-world', 'hoop-world-alt', 'blog_5_img1.jpg', 'SLAM DUNK'),
      'img2': ('mountain-bike', 'mountain-bike', 'mountain-bike-alt', 'blog_5_img2.jpg', 'STUNTS'),
      'img3': ('head-soccer-2026', 'head-soccer-2026', 'hoop-world', 'blog_5_img3.jpg', 'SOCCER'),
      'img4': ('mountain-bike', 'mountain-bike', 'head-soccer-2026', 'blog_5_img4.jpg', 'TROPHY'),
    },
    # Blog 6: Solitaire 2048 & Number Snake
    {
      'cover': ('solitaire-2048', 'solitaire-2048', 'number-snake', 'blog_6_cover.jpg', 'LOGIC'),
      'img1': ('solitaire-2048', 'solitaire-2048', 'solitaire-2048-alt', 'blog_6_img1.jpg', 'CARDS 2048'),
      'img2': ('number-snake', 'number-snake', 'number-snake-alt', 'blog_6_img2.jpg', 'GRID SNAKE'),
      'img3': ('cut-the-candy', 'cut-the-candy', 'solitaire-2048', 'blog_6_img3.jpg', 'ROPES'),
      'img4': ('number-snake', 'number-snake', 'cut-the-candy', 'blog_6_img4.jpg', 'BRAIN'),
    },
    # Blog 7: Paint Hide & Seek & Color Road
    {
      'cover': ('paint-hide-seek', 'paint-hide-seek', 'color-road', 'blog_7_cover.jpg', 'STEALTH'),
      'img1': ('paint-hide-seek', 'paint-hide-seek', 'paint-hide-seek-alt', 'blog_7_img1.jpg', 'CAMOUFLAGE'),
      'img2': ('color-road', 'color-road', 'wave-run', 'blog_7_img2.jpg', 'COLOR ROAD'),
      'img3': ('wave-run', 'wave-run', 'wave-run-alt', 'blog_7_img3.jpg', 'NEON SHIP'),
      'img4': ('paint-hide-seek', 'paint-hide-seek', 'color-road', 'blog_7_img4.jpg', 'TACTICS'),
    },
    # Blog 8: Bike Up & Subway Riders
    {
      'cover': ('bike-up', 'bike-up', 'subway-riders', 'blog_8_cover.jpg', 'RACING'),
      'img1': ('bike-up', 'bike-up', 'bike-up-alt', 'blog_8_img1.jpg', 'TRIALS BIKE'),
      'img2': ('subway-riders', 'subway-riders', 'wave-run', 'blog_8_img2.jpg', 'TRACK RACE'),
      'img3': ('wave-run', 'wave-run', 'wave-run-alt', 'blog_8_img3.jpg', 'SYNTHWAVE'),
      'img4': ('bike-up', 'bike-up', 'subway-riders', 'blog_8_img4.jpg', 'GARAGE'),
    },
    # Blog 9: Nostalgia Revival
    {
      'cover': ('bounce-tales', 'bounce-tales', 'subway-surfers', 'blog_9_cover.jpg', 'NOSTALGIA'),
      'img1': ('bounce-tales', 'bounce-tales', 'bounce-tales-alt', 'blog_9_img1.jpg', 'NOKIA LEGEND'),
      'img2': ('subway-surfers', 'subway-surfers', 'subway-surfers-alt', 'blog_9_img2.jpg', 'RUNNER ERA'),
      'img3': ('angry-birds-2', 'angry-birds-2', 'angry-birds-2-alt', 'blog_9_img3.jpg', 'SLINGSHOT ERA'),
      'img4': ('bounce-tales', 'bounce-tales', 'angry-birds-2', 'blog_9_img4.jpg', 'WEB REVIVAL'),
    },
    # Blog 10: Top 5 Casual Arcade Games
    {
      'cover': ('bottle-flip-3d', 'bottle-flip-3d', 'emoji-runner', 'blog_10_cover.jpg', 'QUICK PLAY'),
      'img1': ('emoji-runner', 'emoji-runner', 'emoji-runner-alt', 'blog_10_img1.jpg', 'ONE TAP'),
      'img2': ('bottle-flip-3d', 'bottle-flip-3d', 'bottle-flip-3d-alt', 'blog_10_img2.jpg', 'FLIP STUNTS'),
      'img3': ('ball-blast', 'ball-blast', 'bottle-flip-3d', 'blog_10_img3.jpg', 'BOULDERS'),
      'img4': ('emoji-runner', 'emoji-runner', 'ball-blast', 'blog_10_img4.jpg', '5 MIN BREAK'),
    },
    # Blog 11: Gamesato Complete Player Guide
    {
      'cover': ('subway-surfers', 'subway-surfers', 'johnny-trigger', 'blog_11_cover.jpg', 'PORTAL GUIDE'),
      'img1': ('subway-surfers', 'subway-surfers', 'banana-kong', 'blog_11_img1.jpg', 'ARCADE SHOWCASE'),
      'img2': ('johnny-trigger', 'johnny-trigger', 'stick-war', 'blog_11_img2.jpg', 'ACTION SHOWCASE'),
      'img3': ('angry-birds-2', 'angry-birds-2', 'solitaire-2048', 'blog_11_img3.jpg', 'PUZZLE SHOWCASE'),
      'img4': ('hoop-world', 'hoop-world', 'bounce-tales', 'blog_11_img4.jpg', 'SPORTS SHOWCASE'),
    }
  ]

  for blog in blogs_config:
    for key in ['cover', 'img1', 'img2', 'img3', 'img4']:
      bg, main, sec, filename, tag = blog[key]
      create_custom_graphic(bg, main, sec, filename, tag)

if __name__ == '__main__':
  generate_all()
