#!/usr/bin/env python3
"""
Generate PNG assets for Kael-OS application
Uses PIL/Pillow to create raster images programmatically
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math
import os

# Theme colors
PRIMARY = (224, 64, 251)      # #e040fb purple
ACCENT = (122, 235, 190)      # #7aebbe cyan
WARNING = (255, 204, 0)       # #ffcc00 yellow
BACKGROUND = (18, 14, 26)     # #120e1a dark
DARK_PURPLE = (88, 24, 120)   # Darker purple for gradients
LIGHT_PURPLE = (240, 120, 255) # Lighter purple

OUTPUT_DIR = "/home/leetheorc/Kael-os/Kael-OS-AI/assets/generated/png"


def create_gradient(width, height, color1, color2, direction='vertical'):
    """Create a gradient image"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    if direction == 'vertical':
        for i in range(height):
            ratio = i / height
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(0, i), (width, i)], fill=(r, g, b))
    else:  # horizontal
        for i in range(width):
            ratio = i / width
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(i, 0), (i, height)], fill=(r, g, b))
    
    return img


def create_radial_gradient(width, height, center_color, edge_color):
    """Create a radial gradient"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = width // 2, height // 2
    max_radius = math.sqrt(center_x**2 + center_y**2)
    
    for y in range(height):
        for x in range(width):
            distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            ratio = min(distance / max_radius, 1.0)
            
            r = int(center_color[0] * (1 - ratio) + edge_color[0] * ratio)
            g = int(center_color[1] * (1 - ratio) + edge_color[1] * ratio)
            b = int(center_color[2] * (1 - ratio) + edge_color[2] * ratio)
            
            draw.point((x, y), fill=(r, g, b))
    
    return img


def create_app_icon(size):
    """Create a Kael-OS app icon with rounded corners"""
    # Create base image with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Rounded rectangle background
    corner_radius = max(8, size // 8)
    draw.rounded_rectangle(
        [(0, 0), (size-1, size-1)],
        radius=corner_radius,
        fill=BACKGROUND + (255,)
    )
    
    # Create gradient overlay
    gradient = create_gradient(size, size, LIGHT_PURPLE, PRIMARY, 'vertical')
    gradient_alpha = Image.new('L', (size, size), 0)
    gradient_draw = ImageDraw.Draw(gradient_alpha)
    gradient_draw.rounded_rectangle(
        [(0, 0), (size-1, size-1)],
        radius=corner_radius,
        fill=255
    )
    gradient.putalpha(gradient_alpha)
    
    # Composite gradient
    img = Image.alpha_composite(img, gradient.convert('RGBA'))
    
    # Draw "K" letter
    draw = ImageDraw.Draw(img)
    letter_size = size // 2
    letter_x = size // 4
    letter_y = size // 4
    
    # Simple K shape using lines
    stroke_width = max(2, size // 16)
    
    # Vertical line of K
    draw.line(
        [(letter_x, letter_y), (letter_x, letter_y + letter_size)],
        fill=ACCENT + (255,),
        width=stroke_width
    )
    
    # Upper diagonal of K
    draw.line(
        [(letter_x, letter_y + letter_size // 2), (letter_x + letter_size // 2, letter_y)],
        fill=ACCENT + (255,),
        width=stroke_width
    )
    
    # Lower diagonal of K
    draw.line(
        [(letter_x, letter_y + letter_size // 2), (letter_x + letter_size // 2, letter_y + letter_size)],
        fill=ACCENT + (255,),
        width=stroke_width
    )
    
    return img


def create_hero_background():
    """Create hero/splash screen background"""
    width, height = 1920, 1080
    
    # Start with radial gradient
    img = create_radial_gradient(width, height, DARK_PURPLE, BACKGROUND)
    
    # Add subtle purple overlay
    overlay = Image.new('RGBA', (width, height), PRIMARY + (20,))
    img = Image.alpha_composite(img.convert('RGBA'), overlay)
    
    # Add some geometric patterns
    draw = ImageDraw.Draw(img)
    
    # Draw circuit-like lines
    for i in range(0, width, 100):
        alpha = 10 + (i % 200) // 20
        draw.line([(i, 0), (i + 200, height)], fill=PRIMARY + (alpha,), width=2)
    
    return img


def create_sidebar_background():
    """Create sidebar background with vertical gradient"""
    width, height = 400, 1080
    
    # Create gradient from dark purple to background
    img = create_gradient(width, height, DARK_PURPLE, BACKGROUND, 'vertical')
    
    # Add subtle accent glow on the left edge
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    for x in range(0, 50):
        alpha = int(30 * (1 - x / 50))
        draw.line([(x, 0), (x, height)], fill=ACCENT + (alpha,))
    
    img = Image.alpha_composite(img.convert('RGBA'), overlay)
    
    return img


def create_terminal_background():
    """Create terminal background with tech pattern"""
    width, height = 1920, 1080
    
    # Dark background
    img = Image.new('RGB', (width, height), BACKGROUND)
    draw = ImageDraw.Draw(img)
    
    # Draw grid pattern
    grid_size = 40
    for x in range(0, width, grid_size):
        draw.line([(x, 0), (x, height)], fill=(25, 20, 35), width=1)
    
    for y in range(0, height, grid_size):
        draw.line([(0, y), (width, y)], fill=(25, 20, 35), width=1)
    
    # Add some random accent dots
    import random
    random.seed(42)  # Consistent pattern
    for _ in range(100):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(1, 3)
        alpha = random.randint(30, 100)
        color = ACCENT if random.random() > 0.5 else PRIMARY
        draw.ellipse(
            [(x, y), (x + size, y + size)],
            fill=(color[0], color[1], color[2])
        )
    
    return img


def create_chat_background():
    """Create chat area background with soft gradient"""
    width, height = 1920, 1080
    
    # Create multi-stop gradient
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    for y in range(height):
        if y < height // 2:
            ratio = y / (height // 2)
            color = BACKGROUND
        else:
            ratio = (y - height // 2) / (height // 2)
            r = int(BACKGROUND[0] * (1 - ratio) + DARK_PURPLE[0] * ratio * 0.3)
            g = int(BACKGROUND[1] * (1 - ratio) + DARK_PURPLE[1] * ratio * 0.3)
            b = int(BACKGROUND[2] * (1 - ratio) + DARK_PURPLE[2] * ratio * 0.3)
            color = (r, g, b)
        
        draw.line([(0, y), (width, y)], fill=color)
    
    return img


def create_avatar_placeholder():
    """Create avatar placeholder"""
    size = 100
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Circle background with gradient
    draw.ellipse([(0, 0), (size-1, size-1)], fill=DARK_PURPLE + (255,))
    
    # Simple user icon
    head_radius = size // 6
    head_center = (size // 2, size // 3)
    draw.ellipse(
        [(head_center[0] - head_radius, head_center[1] - head_radius),
         (head_center[0] + head_radius, head_center[1] + head_radius)],
        fill=ACCENT + (255,)
    )
    
    # Body (half circle at bottom)
    body_width = size // 2
    body_height = size // 3
    body_y = int(size * 0.6)
    draw.ellipse(
        [(size // 2 - body_width // 2, body_y),
         (size // 2 + body_width // 2, body_y + body_height)],
        fill=ACCENT + (255,)
    )
    
    return img


def create_notification_badge():
    """Create notification badge"""
    size = 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Red circle
    draw.ellipse([(0, 0), (size-1, size-1)], fill=(220, 50, 50, 255))
    
    # White border
    draw.ellipse([(2, 2), (size-3, size-3)], outline=(255, 255, 255, 255), width=2)
    
    return img


def create_status_indicator(online=True):
    """Create status indicator dot"""
    size = 16
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    color = (80, 200, 120) if online else (128, 128, 128)
    
    # Draw circle
    draw.ellipse([(0, 0), (size-1, size-1)], fill=color + (255,))
    
    # Add highlight
    highlight_size = size // 4
    draw.ellipse(
        [(size // 4, size // 4), (size // 4 + highlight_size, size // 4 + highlight_size)],
        fill=(255, 255, 255, 100)
    )
    
    return img


def main():
    """Generate all PNG assets"""
    print("🎨 Generating PNG assets for Kael-OS...")
    
    total_files = 0
    total_size = 0
    
    # 1. Generate app icons
    print("\n📱 Generating app icons...")
    icon_sizes = [16, 32, 48, 64, 128, 256, 512]
    for size in icon_sizes:
        filename = f"{OUTPUT_DIR}/app-icons/icon-{size}.png"
        icon = create_app_icon(size)
        icon.save(filename, 'PNG', optimize=True)
        file_size = os.path.getsize(filename)
        total_size += file_size
        total_files += 1
        print(f"  ✓ icon-{size}.png ({file_size:,} bytes)")
    
    # 2. Generate backgrounds
    print("\n🖼️  Generating backgrounds...")
    
    backgrounds = {
        'hero-background.png': create_hero_background,
        'sidebar-background.png': create_sidebar_background,
        'terminal-background.png': create_terminal_background,
        'chat-background.png': create_chat_background,
    }
    
    for filename, creator_func in backgrounds.items():
        filepath = f"{OUTPUT_DIR}/backgrounds/{filename}"
        img = creator_func()
        img.save(filepath, 'PNG', optimize=True)
        file_size = os.path.getsize(filepath)
        total_size += file_size
        total_files += 1
        print(f"  ✓ {filename} ({file_size:,} bytes)")
    
    # 3. Generate UI elements
    print("\n🎯 Generating UI elements...")
    
    ui_elements = {
        'avatar-placeholder.png': create_avatar_placeholder,
        'notification-badge.png': create_notification_badge,
        'status-online.png': lambda: create_status_indicator(True),
        'status-offline.png': lambda: create_status_indicator(False),
    }
    
    for filename, creator_func in ui_elements.items():
        filepath = f"{OUTPUT_DIR}/ui-elements/{filename}"
        img = creator_func()
        img.save(filepath, 'PNG', optimize=True)
        file_size = os.path.getsize(filepath)
        total_size += file_size
        total_files += 1
        print(f"  ✓ {filename} ({file_size:,} bytes)")
    
    # Summary
    print(f"\n✅ Generation complete!")
    print(f"   Files created: {total_files}")
    print(f"   Total size: {total_size:,} bytes ({total_size / 1024 / 1024:.2f} MB)")
    
    return total_files, total_size


if __name__ == '__main__':
    main()
