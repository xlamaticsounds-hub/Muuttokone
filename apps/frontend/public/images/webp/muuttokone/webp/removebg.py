import os
from rembg import remove
from PIL import Image

for root, dirs, files in os.walk('.'):
    for filename in files:
        if filename.lower().endswith('voimamie.png'):
            filepath = os.path.join(root, filename)
            with Image.open(filepath) as img:
                output = remove(img)
                output.save(filepath)
print("Background removal complete.")