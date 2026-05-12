import os
import re
import urllib.request
import hashlib

d = 'c:/Users/shaik/OneDrive/Desktop/Trade/frontend'
img_dir = os.path.join(d, 'assets')
os.makedirs(img_dir, exist_ok=True)

htmls = [f for f in os.listdir(d) if f.endswith('.html')]
print('HTMLs:', htmls)

for h in htmls:
    p = os.path.join(d, h)
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    
    urls = set(re.findall(r'src="(https://lh3.googleusercontent.com/aida-public/[^"]+)"', content))
    for u in urls:
        ext = '.jpg'
        hsh = hashlib.md5(u.encode('utf-8')).hexdigest()[:10]
        img_name = f'image_{hsh}{ext}'
        img_path = os.path.join(img_dir, img_name)
        
        if not os.path.exists(img_path):
            try:
                print(f'Downloading {u} to {img_name}')
                urllib.request.urlretrieve(u, img_path)
            except Exception as e:
                print('Failed', u, e)
                continue
                
        content = content.replace(u, f'assets/{img_name}')
            
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done downloading and replacing.")
