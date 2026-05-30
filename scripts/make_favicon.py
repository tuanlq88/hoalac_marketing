"""Crop favicon: zoom on strategist + circular crop (transparent corners)."""
from PIL import Image, ImageDraw
import os

SRC = r"C:\Users\tuale\Downloads\muu_si_alone.png"
DST = "public/favicon.png"

img = Image.open(SRC).convert("RGBA")
w, h = img.size
print(f"Source: {w}x{h}")

# Figure (black + red robe) is in lower-left of the circle.
# Red robe: x=304-465, y=678-1148
# Hair bun (top of figure) starts around y=450
# Figure box: x=200-500, y=440-1170 → width ~300, height ~730

# Tight crop around figure (left side of original)
# But we want a SQUARE crop centered on figure
fig_cx, fig_cy = 355, 770  # center of figure
box = 800  # bigger box than just figure for some breathing room
left = max(0, fig_cx - box // 2)
top = max(0, fig_cy - box // 2)
right = min(w, left + box)
bottom = min(h, top + box)
# Make sure it's still square
side = min(right - left, bottom - top)
right = left + side
bottom = top + side

cropped = img.crop((left, top, right, bottom))
print(f"Cropped: {cropped.size} from ({left},{top}) to ({right},{bottom})")

# Resize to 512x512
target = 512
cropped = cropped.resize((target, target), Image.LANCZOS)

# Circular mask — transparent outside
mask = Image.new("L", (target, target), 0)
draw = ImageDraw.Draw(mask)
draw.ellipse((0, 0, target, target), fill=255)

result = Image.new("RGBA", (target, target), (0, 0, 0, 0))
result.paste(cropped, (0, 0), mask)

result.save(DST, "PNG", optimize=True)
print(f"Saved: {DST} ({os.path.getsize(DST)} bytes)")
