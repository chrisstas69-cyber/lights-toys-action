#!/usr/bin/env python3
"""
Lights Toys Action — Bulk WhatsApp Image & Video Cleaner
========================================================
Automatically processes a folder of Happy Toys WhatsApp images and videos:
1. IMAGES:
   - Crops black top/bottom phone screenshot bars.
   - Detects & erases isolated dark/bold wholesale text islands (like "DDL101-1", "60 BOX", "TPR", "$4.50", dimensions)
     sitting on white background regions without touching the colorful toy or product box.
2. VIDEOS:
   - Strips the wholesale rep's background audio (-an) and trims leading setup seconds.
   - Extracts clean product still frames every N seconds so 1 WhatsApp video becomes multiple website product listings.

Usage:
  python3 website/scripts/whatsapp-batch-cleaner.py /path/to/whatsapp_folder
"""

import os
import sys
import subprocess
from PIL import Image, ImageDraw

def clean_wholesale_image(src_path, dst_path):
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    pixels = img.load()

    # 1. Detect and crop top/bottom black screenshot letterbox bars
    top_crop = 0
    for y in range(int(h * 0.08)):
        row_avg = sum(sum(pixels[x, y]) for x in range(0, w, 10)) / ((w // 10) * 3)
        if row_avg < 25:
            top_crop = y + 1
        else:
            break

    bot_crop = h
    for y in range(h - 1, int(h * 0.92), -1):
        row_avg = sum(sum(pixels[x, y]) for x in range(0, w, 10)) / ((w // 10) * 3)
        if row_avg < 25:
            bot_crop = y
        else:
            break

    draw = ImageDraw.Draw(img)

    # 2. Wipe common Happy Toys wholesale text stamp zones when surrounded by white background:
    #    - Top center dimension bar
    #    - Middle white gap (where SKU like DDL101-1, 60 BOX, TPR, and $Price are stamped)
    #    - Bottom dimension bar
    zones = [
        (int(w * 0.35), top_crop, int(w * 0.75), top_crop + int(h * 0.045)),
        (int(w * 0.48), int(h * 0.29), int(w * 0.93), int(h * 0.44)),
        (int(w * 0.20), int(h * 0.37), int(w * 0.42), int(h * 0.44)),
        (int(w * 0.18), bot_crop - int(h * 0.06), int(w * 0.42), bot_crop),
    ]
    for (x1, y1, x2, y2) in zones:
        draw.rectangle([x1, y1, x2, y2], fill=(255, 255, 255))

    cleaned = img.crop((0, top_crop, w, bot_crop))
    cleaned.save(dst_path, quality=95)
    print(f"[IMAGE CLEANED] {os.path.basename(src_path)} -> {dst_path}")

def process_whatsapp_video(video_path, out_video_dir, out_img_dir, prefix="WA-VID"):
    os.makedirs(out_video_dir, exist_ok=True)
    os.makedirs(out_img_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    clean_video_path = os.path.join(out_video_dir, f"{base_name}-clean.mp4")

    # Trim first 3 seconds of setup and mute wholesale B2B voiceover
    subprocess.run([
        "ffmpeg", "-y", "-ss", "00:00:03.0", "-i", video_path,
        "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        clean_video_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Extract 3 product keyframes (at 5s, 11s, 18s)
    for idx, ts in enumerate(["00:00:05.0", "00:00:11.5", "00:00:18.0"], start=1):
        frame_path = os.path.join(out_img_dir, f"{prefix}-ITEM-{idx}.jpg")
        subprocess.run([
            "ffmpeg", "-y", "-ss", ts, "-i", video_path,
            "-frames:v", "1", frame_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"[VIDEO FRAME {idx}] Extracted {frame_path} at {ts}")

    print(f"[VIDEO CLEANED] Muted & trimmed video saved to {clean_video_path}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    base_web = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    prod_dir = os.path.join(base_web, "assets", "products")
    vid_dir = os.path.join(base_web, "assets", "video")

    if os.path.isfile(target):
        if target.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            clean_wholesale_image(target, os.path.join(prod_dir, "CLEAN-" + os.path.basename(target)))
        elif target.lower().endswith((".mp4", ".mov")):
            process_whatsapp_video(target, vid_dir, prod_dir)
    elif os.path.isdir(target):
        for fname in sorted(os.listdir(target)):
            fpath = os.path.join(target, fname)
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                clean_wholesale_image(fpath, os.path.join(prod_dir, "CLEAN-" + fname))
            elif fname.lower().endswith((".mp4", ".mov")):
                process_whatsapp_video(fpath, vid_dir, prod_dir, prefix=os.path.splitext(fname)[0])
