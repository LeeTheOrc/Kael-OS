#!/usr/bin/env python3
"""
Generate artistic dragon-bird avatar icon for Kael-OS using Google Gemini AI
Colors: Purple (#8b5cf6), Blue (#3b82f6), Dark backgrounds
"""

import os
import requests
import base64
from pathlib import Path

# Kael-OS color scheme
COLORS = {
    'accent_purple': '#8b5cf6',
    'accent_blue': '#3b82f6',
    'bg_primary': '#0d1117',
    'bg_secondary': '#161b22'
}

PROMPT = """
Create a mystical, futuristic avatar icon of a sleek bird-dragon hybrid creature.

Style requirements:
- Minimalist, modern, geometric design suitable for an app icon
- Avatar/profile style composition (head/upper body focus)
- Sharp, clean lines with a tech-aesthetic
- Glowing elements suggesting AI/digital nature

Colors (STRICTLY USE THESE):
- Primary: Vibrant purple (#8b5cf6) 
- Secondary: Electric blue (#3b82f6)
- Accents: Dark purple/navy gradients
- Subtle glow effects in purple and blue
- Dark background (#0d1117 to #161b22)

Creature design:
- Dragon-like head with intelligent, piercing eyes
- Sleek bird-like features (streamlined beak/snout, elegant neck)
- Ethereal, mystical aura
- Tech-enhanced elements (circuit patterns, energy glow)
- Majestic, wise, powerful presence
- Forward-facing, centered composition

Art style:
- Digital art, vector-like quality
- Cyberpunk/sci-fi fantasy fusion
- Icon-friendly (clear at small sizes)
- Professional, polished finish
- Gradient overlays for depth

The icon should represent an AI assistant - intelligent, mystical, powerful, and futuristic.
Perfect for a 512x512 or 1024x1024 app icon.
"""

def generate_icon_with_gemini():
    """Generate icon using Google Gemini image generation"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment")
        print("Please set it: export GEMINI_API_KEY='your-key-here'")
        return False
    
    print("🎨 Generating dragon-bird avatar icon with Gemini AI...")
    print(f"🎨 Using colors: Purple {COLORS['accent_purple']}, Blue {COLORS['accent_blue']}")
    
    # Gemini API endpoint for image generation (Imagen)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": f"Generate an image: {PROMPT}"
            }]
        }],
        "generationConfig": {
            "temperature": 0.9,
            "topK": 40,
            "topP": 0.95,
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        
        # Check if image was generated
        if 'candidates' in result and len(result['candidates']) > 0:
            print("✅ Gemini responded!")
            print("📝 Note: Gemini 1.5 Flash doesn't generate images directly.")
            print("📝 We'll use a different approach - calling DALL-E style service or local generator")
            return False
        
    except Exception as e:
        print(f"⚠️ Gemini image generation not available: {e}")
        return False

def generate_icon_with_local_tools():
    """Generate icon using local Python image generation"""
    print("🎨 Generating icon using local Python tools...")
    
    try:
        from PIL import Image, ImageDraw, ImageFilter
        import numpy as np
        
        # Create 1024x1024 canvas
        size = 1024
        img = Image.new('RGBA', (size, size), (13, 17, 23, 255))
        draw = ImageDraw.Draw(img)
        
        # Parse hex colors
        def hex_to_rgb(hex_color):
            hex_color = hex_color.lstrip('#')
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        
        purple = hex_to_rgb(COLORS['accent_purple'])
        blue = hex_to_rgb(COLORS['accent_blue'])
        
        # Create stylized dragon-bird shape
        center = size // 2
        
        # Head circle (purple gradient)
        for i in range(200, 0, -2):
            alpha = int(255 * (i / 200))
            color = purple + (alpha,)
            draw.ellipse([center - i, center - i, center + i, center + i], 
                        fill=color, outline=None)
        
        # Eye glow (blue)
        eye_left = (center - 80, center - 40)
        eye_right = (center + 80, center - 40)
        for i in range(40, 0, -2):
            alpha = int(255 * (i / 40))
            color = blue + (alpha,)
            draw.ellipse([eye_left[0] - i, eye_left[1] - i, 
                         eye_left[0] + i, eye_left[1] + i], fill=color)
            draw.ellipse([eye_right[0] - i, eye_right[1] - i,
                         eye_right[0] + i, eye_right[1] + i], fill=color)
        
        # Wing/crest elements (purple accents)
        points_left = [
            (center - 250, center - 100),
            (center - 150, center - 200),
            (center - 100, center - 50)
        ]
        points_right = [
            (center + 250, center - 100),
            (center + 150, center - 200),
            (center + 100, center - 50)
        ]
        
        draw.polygon(points_left, fill=purple + (180,))
        draw.polygon(points_right, fill=purple + (180,))
        
        # Apply blur for smooth glow
        img = img.filter(ImageFilter.GaussianBlur(radius=5))
        
        # Save at multiple sizes
        output_dir = Path(__file__).parent / "assets" / "generated" / "png" / "app-icons"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
        for s in sizes:
            resized = img.resize((s, s), Image.Resampling.LANCZOS)
            output_path = output_dir / f"dragon-icon-{s}.png"
            resized.save(output_path, "PNG")
            print(f"✅ Saved: {output_path}")
        
        # Also save to src-tauri/icons
        tauri_dir = Path(__file__).parent / "src-tauri" / "icons"
        icon_path = tauri_dir / "dragon-icon.png"
        img.resize((512, 512), Image.Resampling.LANCZOS).save(icon_path, "PNG")
        print(f"✅ Saved: {icon_path}")
        
        print("✅ Basic dragon icon generated!")
        print("📝 This is a placeholder - for best results, use an AI image generator")
        return True
        
    except ImportError:
        print("❌ PIL (Pillow) not installed")
        print("Install with: pip install Pillow")
        return False

def create_prompt_file():
    """Save the detailed prompt for manual use with AI image generators"""
    prompt_file = Path(__file__).parent / "DRAGON_ICON_PROMPT.txt"
    
    with open(prompt_file, 'w') as f:
        f.write("="*80 + "\n")
        f.write("KAEL-OS DRAGON-BIRD AVATAR ICON GENERATION PROMPT\n")
        f.write("="*80 + "\n\n")
        f.write("USE THIS PROMPT WITH:\n")
        f.write("- DALL-E 3 (ChatGPT Plus)\n")
        f.write("- Midjourney\n")
        f.write("- Stable Diffusion\n")
        f.write("- Adobe Firefly\n\n")
        f.write("="*80 + "\n\n")
        f.write(PROMPT)
        f.write("\n\n" + "="*80 + "\n")
        f.write(f"COLOR CODES:\n")
        for name, code in COLORS.items():
            f.write(f"  {name}: {code}\n")
        f.write("="*80 + "\n")
    
    print(f"✅ Prompt saved to: {prompt_file}")
    print(f"📋 Use this prompt with DALL-E, Midjourney, or other AI image generators")
    return prompt_file

if __name__ == "__main__":
    print("🐉 Kael-OS Dragon-Bird Avatar Icon Generator\n")
    
    # Try Gemini first
    success = generate_icon_with_gemini()
    
    # If Gemini fails, try local generation
    if not success:
        success = generate_icon_with_local_tools()
    
    # Always create the prompt file for manual generation
    prompt_file = create_prompt_file()
    
    if success:
        print("\n✅ Icon generation complete!")
    else:
        print("\n📝 Auto-generation not available.")
        print(f"📋 Please use the prompt in: {prompt_file}")
        print("🎨 Recommended: Use DALL-E 3 or Midjourney for best results")
