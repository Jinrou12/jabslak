#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Temple Map Clean Annotator
Draws ONLY Khmer text labels over the cleaned aerial map (Numbers & ABCDE erased).
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from PIL import Image, ImageDraw, ImageFont
import os

# Exact locations (x, y) measured directly from map.jpg (966x966)
# Format: (name, target_x, target_y, box_position, category)

MARKERS = [
    ("ធម្មសាលាសភា",                  156, 428, "C", "building"),
    ("មហាកុដិ",                       182, 520, "C", "building"),
    ("កុដិសាឡុម",                     142, 673, "C", "building"),
    ("កុដិតូច",                       43,  342, "C", "building"),
    ("កុដិថ្មី",                      157, 259, "C", "building"),
    ("កុដិគ្រូធំ",                   235, 259, "C", "building"),
    ("ព្រះវិហារ",                     362, 524, "C", "building"),
    ("ដើមពោធិព្រឹក្ស",               348, 636, "C", "building"),
    ("បណ្ណាល័យ",                     568, 523, "C", "building"),
    ("ពុទ្ឌកបឋមសិក្សាកម្រងហ៊ុនណេង", 565, 430, "C", "building"),
    ("កុដិយាយតា",                    421, 258, "C", "building"),
    ("ប៉ុស្តវិទ្យុ",                 523, 209, "C", "building"),
    ("អាងទឹក",                       640, 283, "C", "building"),
    ("អាងទឹកវិទ្យុ",                603, 183, "C", "building"),
    ("ព្រះផ្ទំ",                      627, 351, "C", "building"),
    ("ចេយតីចាយសៀងអីុ",              514, 759, "C", "building"),
    ("ក្លោងទ្វារទី១",               740, 61,  "C", "gate"),
    ("ក្លោងទ្វារទី២",               278, 186, "C", "gate"),
    ("ក្លោងទ្វារទី៣",               907, 536, "C", "gate"),
    ("ក្លោងទ្វារទី៤",               706, 683, "C", "gate"),
    ("ក្លោងទ្វារទី៥",               41,  452, "C", "gate"),
]

FONT_PATHS = [
    r"C:\Users\Visal\AppData\Local\Microsoft\Windows\Fonts\Battambang-Bold.ttf",
    r"C:\Users\Visal\AppData\Local\Microsoft\Windows\Fonts\KhmerOSbattambang.ttf",
    r"C:\Users\Visal\AppData\Local\Microsoft\Windows\Fonts\NotoSansKhmer-Bold.ttf",
    r"C:\Windows\Fonts\KhmerUIb.ttf",
]

def get_font(size):
    for p in FONT_PATHS:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_clean_label(draw, img_w, img_h, name, tx, ty, category, font):
    border_color = (0, 229, 255) if category == "building" else (255, 214, 0)

    nm_bb = font.getbbox(name)
    nw = nm_bb[2] - nm_bb[0]
    nh = nm_bb[3] - nm_bb[1]

    px, py = 7, 4
    box_w = nw + px * 2
    box_h = nh + py * 2

    # Center box on the target location
    bx1 = tx - box_w // 2
    by1 = ty - box_h // 2
    bx2 = bx1 + box_w
    by2 = by1 + box_h

    # Ensure box remains within image bounds
    if bx1 < 4:
        bx1, bx2 = 4, 4 + box_w
    if bx2 > img_w - 4:
        bx1, bx2 = img_w - 4 - box_w, img_w - 4
    if by1 < 4:
        by1, by2 = 4, 4 + box_h
    if by2 > img_h - 4:
        by1, by2 = img_h - 4 - box_h, img_h - 4

    # Rounded rectangle background box with subtle shadow
    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=5, fill=(15, 23, 42, 230), outline=border_color, width=2)

    # Render Khmer text
    text_x = bx1 + px - nm_bb[0]
    text_y = by1 + py - nm_bb[1]

    for dx, dy in [(-1,-1),(1,-1),(-1,1),(1,1),(0,-1),(0,1),(-1,0),(1,0)]:
        draw.text((text_x + dx, text_y + dy), name, font=font, fill=(0, 0, 0))

    draw.text((text_x, text_y), name, font=font, fill=(255, 255, 255))

def main():
    bg_path = 'map_clean.jpg' if os.path.exists('map_clean.jpg') else 'map.jpg'
    img = Image.open(bg_path).convert('RGBA')
    W, H = img.size
    print(f"Annotating clean image {bg_path} ({W}x{H})...")

    overlay = Image.new('RGBA', (W, H), (0,0,0,0))
    draw = ImageDraw.Draw(overlay)

    font = get_font(14)

    for (name, tx, ty, pos, category) in MARKERS:
        draw_clean_label(draw, W, H, name, tx, ty, category, font)
        print(f"Labeled -> {name} at ({tx}, {ty})")

    out_img = Image.alpha_composite(img, overlay).convert('RGB')
    out_img.save('temple_map_labeled.jpg', quality=95)
    print("Saved temple_map_labeled.jpg successfully!")

if __name__ == '__main__':
    main()
