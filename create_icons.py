#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

icons_dir = 'src-tauri/icons'

# Create icon.png in RGBA format
img = Image.new('RGBA', (256, 256), (30, 30, 46, 255))
draw = ImageDraw.Draw(img)
margin = 30
draw.ellipse([margin, margin, 256-margin, 256-margin], fill=(100, 150, 255, 255), outline=(150, 180, 255, 255), width=3)

# Save PNG
img.save(f'{icons_dir}/icon.png')
print(f"Created icon.png")

# Create ICO
img.save(f'{icons_dir}/icon.ico')
print(f"Created icon.ico")

# Verify
for fname in ['icon.png', 'icon.ico']:
    try:
        test_img = Image.open(f'{icons_dir}/{fname}')
        print(f"{fname}: {test_img.mode} {test_img.size}")
    except Exception as e:
        print(f"{fname}: ERROR - {e}")
