import os
from pathlib import Path
from PIL import Image

#!/usr/bin/env python3

def process_images():
    """Upscale PNG files, convert to WebP and AVIF with 90% quality"""
    cwd = Path.cwd()
    
    # Find all PNG files in current directory
    png_files = list(cwd.glob("*.png"))
    
    if not png_files:
        print("No PNG files found in current directory")
        return
    
    for png_file in png_files:
        try:
            print(f"Processing {png_file.name}...")
            
            # Open and upscale image (2x)
            img = Image.open(png_file)
            original_size = img.size
            new_size = (original_size[0] * 2, original_size[1] * 2)
            img_upscaled = img.resize(new_size, Image.LANCZOS)
            
            # Base filename without extension
            base_name = png_file.stem
            
            # Save as WebP
            webp_path = cwd / f"{base_name}_upscaled.webp"
            img_upscaled.save(webp_path, "WEBP", quality=90)
            print(f"  Saved WebP: {webp_path.name}")
            
            # Save as AVIF
            avif_path = cwd / f"{base_name}_upscaled.avif"
            img_upscaled.save(avif_path, "AVIF", quality=90)
            print(f"  Saved AVIF: {avif_path.name}")
            
        except Exception as e:
            print(f"  Error processing {png_file.name}: {e}")
    
    print("\nProcessing complete!")

if __name__ == "__main__":
    process_images()