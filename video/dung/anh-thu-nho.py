# Ảnh thu nhỏ (thumbnail) 1280×720 cho video giới thiệu: tên phần mềm chữ lớn bên trái, bốn ảnh sản phẩm (cắt từ các cảnh đã quay) bên phải.
#   python video/dung/anh-thu-nho.py   → video/anh-thu-nho.jpg
import json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W, H = 1280, 720
F = lambda name, size: ImageFont.truetype(os.path.join(os.environ.get('WINDIR', 'C:/Windows'), 'Fonts', name), size)

def frame(rec, mark, cam):
    """khung của cảnh rec tại mốc mark, cắt theo cam {x, y, w} (toạ độ cảnh quay, cao = rộng × 9/16)"""
    d = os.path.join(ROOT, 'khung', rec)
    m = json.load(open(os.path.join(d, 'meta.json'), encoding='utf8'))
    t = next((k['t'] for k in m['marks'] if k['name'] == mark), m['frames'][-1]['t'])
    f = m['frames'][0]['f']
    for fr in m['frames']:
        if fr['t'] <= t: f = fr['f']
    im = Image.open(os.path.join(d, f)).convert('RGB')
    k = im.width / m['w']
    x, y, w = cam
    return im.crop((int(x * k), int(y * k), int((x + w) * k), int((y + w * 9 / 16) * k)))

bg = Image.new('RGB', (W, H), '#ffffff')
g = ImageDraw.Draw(bg)
for yy in range(H):  # nền chuyển màu trắng → xanh nhạt
    c = 255 - int(yy / H * 28)
    g.line([(0, yy), (W, yy)], fill=(c - 6, c, 255))

tiles = [
    frame('c2-bang-do-thi', 'het', (262, 222, 800)),
    frame('c3-hinh-phang', 'het', (180, 195, 940)),
    frame('c4-khong-gian', 'het', (95, 228, 780)),
    frame('c7-word', 'chuyen-xong', (150, 200, 1600)),
]
tw, th, gap = 300, 169, 18
x0, y0 = W - 2 * tw - gap - 36, 150
for i, t in enumerate(tiles):
    t = t.resize((tw, th), Image.LANCZOS)
    x, y = x0 + (i % 2) * (tw + gap), y0 + (i // 2) * (th + gap + 8)
    sh = Image.new('RGBA', (tw + 30, th + 30), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((15, 15, tw + 15, th + 15), 12, fill=(0, 0, 0, 70))
    bg.paste(sh.filter(ImageFilter.GaussianBlur(8)), (x - 15, y - 9), sh.filter(ImageFilter.GaussianBlur(8)))
    ImageDraw.Draw(bg).rounded_rectangle((x - 5, y - 5, x + tw + 5, y + th + 5), 10, fill='#ffffff')
    bg.paste(t, (x, y))

d = ImageDraw.Draw(bg)
blue, dark, gold = '#1f5fbf', '#14233d', '#f2b705'
d.rounded_rectangle((48, 70, 148, 170), 24, fill=blue)
d.text((98, 116), '∑', font=F('cambria.ttc', 84), fill='#ffffff', anchor='mm')
d.text((48, 190), 'ToanViet', font=F('segoeuib.ttf', 96), fill=dark)
d.text((48, 292), 'Studio', font=F('segoeuib.ttf', 96), fill=blue)
y = 420
for line in ['Công thức & hình vẽ', 'chuẩn SGK Việt Nam', 'Toán · Lí · Hoá · Sinh']:
    d.text((50, y), line, font=F(('seguisb.ttf' if os.path.exists(os.path.join(os.environ.get('WINDIR', 'C:/Windows'), 'Fonts', 'seguisb.ttf')) else 'segoeuib.ttf'), 40), fill=dark); y += 52
d.rounded_rectangle((48, 600, 470, 664), 32, fill=gold)
d.text((259, 632), 'MIỄN PHÍ · MÃ NGUỒN MỞ', font=F('segoeuib.ttf', 30), fill=dark, anchor='mm')
d.text((x0 + tw + gap // 2, y0 + 2 * th + gap + 60), 'Vào thẳng Word, PowerPoint', font=F(('seguisb.ttf' if os.path.exists(os.path.join(os.environ.get('WINDIR', 'C:/Windows'), 'Fonts', 'seguisb.ttf')) else 'segoeuib.ttf'), 30), fill=blue, anchor='mm')
out = os.path.join(ROOT, 'anh-thu-nho.jpg')
bg.save(out, quality=92)
print('ẢNH', out, os.path.getsize(out) // 1024, 'KB')
