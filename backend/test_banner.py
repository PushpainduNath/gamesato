import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_banner(bg_icon_path, icon1_path, icon2_path, output_path, title_text="", category_text=""):
  width, height = 1200, 675
  
  # 1. Base image with gradient
  base = Image.new('RGB', (width, height), (10, 15, 29))
  
  # 2. Atmospheric blurred background from main icon
  if os.path.exists(bg_icon_path):
    try:
      bg_img = Image.open(bg_icon_path).convert('RGB')
      bg_img = bg_img.resize((width, height), Image.Resampling.LANCZOS)
      bg_img = bg_img.filter(ImageFilter.GaussianBlur(30))
      
      # Darken blurred background
      overlay = Image.new('RGB', (width, height), (0, 0, 0))
      base = Image.blend(bg_img, overlay, 0.55)
    except Exception as e:
      print(f"BG Error: {e}")
      
  draw = ImageDraw.Draw(base)
  
  # 3. Add diagonal glowing background streaks
  overlay_draw = ImageDraw.Draw(base)
  
  # 4. Helper to draw rounded, bordered card for game icon
  def draw_icon_card(icon_path, size, pos, border_color=(45, 212, 191)):
    if not os.path.exists(icon_path):
      return
    try:
      icon = Image.open(icon_path).convert('RGBA')
      icon = icon.resize((size, size), Image.Resampling.LANCZOS)
      
      # Rounded corners mask
      mask = Image.new('L', (size, size), 0)
      mask_draw = ImageDraw.Draw(mask)
      mask_draw.rounded_rectangle((0, 0, size, size), radius=24, fill=255)
      
      # Border card
      border_size = size + 16
      card = Image.new('RGBA', (border_size, border_size), (0, 0, 0, 0))
      card_draw = ImageDraw.Draw(card)
      card_draw.rounded_rectangle((0, 0, border_size, border_size), radius=28, fill=border_color)
      
      # Composite icon into card
      card.paste(icon, (8, 8), mask)
      
      # Paste onto base
      base.paste(card, pos, card)
    except Exception as e:
      print(f"Card error: {e}")

  # Render Icon 1 (Left Main)
  if os.path.exists(icon1_path):
    draw_icon_card(icon1_path, 340, (140, 160), border_color=(45, 212, 191, 255))
    
  # Render Icon 2 (Right Secondary)
  if icon2_path and os.path.exists(icon2_path):
    draw_icon_card(icon2_path, 300, (720, 180), border_color=(245, 158, 11, 255))

  # Render Category Badge
  if category_text:
    badge_rect = (50, 40, 220, 80)
    draw.rounded_rectangle(badge_rect, radius=20, fill=(20, 184, 166), outline=(45, 212, 191), width=2)
    draw.text((75, 52), category_text.upper(), fill=(255, 255, 255))

  # Save Output
  base.save(output_path, quality=92)
  print(f"Saved custom banner to {output_path}")

if __name__ == '__main__':
  create_banner(
    '/Users/pushpaindunath/Desktop/Dont-Touch/projects/gamesato/backend/uploads/thumbnails/subway-surfers-1785664432443.jpg',
    '/Users/pushpaindunath/Desktop/Dont-Touch/projects/gamesato/backend/uploads/thumbnails/subway-surfers-1785664432443.jpg',
    '/Users/pushpaindunath/Desktop/Dont-Touch/projects/gamesato/backend/uploads/thumbnails/banana-kong-1785665023318.jpg',
    '/Users/pushpaindunath/Desktop/Dont-Touch/projects/gamesato/backend/uploads/media/blog_1_cover.jpg',
    category_text="ARCADE"
  )
