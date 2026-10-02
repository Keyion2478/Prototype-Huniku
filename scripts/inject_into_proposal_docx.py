import os
import zipfile
import tempfile
import xml.etree.ElementTree as ET
from PIL import Image

DOCX_PATH = r"A:\##KULIAH##\SEMESTER 5\PJBL\Huniku\Propoosal APLIKASI MANAJEMEN DAN LAYANAN INFORMASI PERUMAHAN.docx"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJ_ROOT = os.path.dirname(SCRIPT_DIR)
NEW_IMAGES_DIR = os.path.join(PROJ_ROOT, "assets", "proposal_docx_images")

RID_TO_IMAGE = {
    "rId12": "image5.png",
    "rId13": "image6.png",
    "rId14": "image7.png",
    "rId15": "image8.png",
    "rId16": "image9.png",
    "rId17": "image10.png",
    "rId18": "image11.png",
    "rId19": "image12.png",
    "rId20": "image13.png",
    "rId21": "image14.png",
    "rId22": "image15.png",
    "rId23": "image16.png",
    "rId24": "image17.png",
    "rId25": "image18.png",
    "rId26": "image19.png",
    "rId27": "image20.png"
}

def inject_images():
    print(f"Reading target docx: {DOCX_PATH}")
    
    # Pre-load new image data & calculate aspect ratios
    new_images = {}
    ratios = {}
    for rid, img_name in RID_TO_IMAGE.items():
        img_path = os.path.join(NEW_IMAGES_DIR, img_name)
        if not os.path.exists(img_path):
            raise FileNotFoundError(f"Missing new image: {img_path}")
        
        with open(img_path, "rb") as f:
            new_images[f"word/media/{img_name}"] = f.read()
        
        with Image.open(img_path) as img:
            w, h = img.size
            ratios[rid] = h / w
            print(f"Loaded {img_name} ({w}x{h}, ratio={ratios[rid]:.4f})")

    # Read the docx archive
    temp_dir = tempfile.mkdtemp()
    unpacked_files = {}
    with zipfile.ZipFile(DOCX_PATH, "r") as z:
        for info in z.infolist():
            unpacked_files[info.filename] = z.read(info.filename)
            
    # Process document.xml to adjust extent cy based on aspect ratio
    xml_content = unpacked_files["word/document.xml"]
    
    # Register all namespaces
    namespaces = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }
    for prefix, uri in namespaces.items():
        ET.register_namespace(prefix, uri)
    
    root = ET.fromstring(xml_content)
    
    # Find all inline and anchor drawings
    modified_count = 0
    for container_tag in ['.//wp:inline', './/wp:anchor']:
        for container in root.findall(container_tag, namespaces):
            blip = container.find('.//a:blip', namespaces)
            if blip is not None:
                embed = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                if embed in ratios:
                    ratio = ratios[embed]
                    # Update wp:extent
                    extent = container.find('wp:extent', namespaces)
                    if extent is not None and 'cx' in extent.attrib:
                        cx = int(extent.attrib['cx'])
                        new_cy = int(cx * ratio)
                        old_cy = extent.attrib.get('cy', 'unknown')
                        extent.attrib['cy'] = str(new_cy)
                        print(f"Updated extent for {embed} ({RID_TO_IMAGE[embed]}): cx={cx}, cy: {old_cy} -> {new_cy}")
                    
                    # Update a:xfrm/a:ext
                    a_ext = container.find('.//a:xfrm/a:ext', namespaces)
                    if a_ext is not None and 'cx' in a_ext.attrib:
                        cx = int(a_ext.attrib['cx'])
                        new_cy = int(cx * ratio)
                        a_ext.attrib['cy'] = str(new_cy)
                    
                    modified_count += 1
    
    print(f"Total XML drawing extents updated: {modified_count}")
    unpacked_files["word/document.xml"] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    
    # Replace media files
    for media_name, media_data in new_images.items():
        unpacked_files[media_name] = media_data
        print(f"Replaced media: {media_name}")
        
    # Write back to target docx
    temp_docx = os.path.join(temp_dir, "updated.docx")
    with zipfile.ZipFile(temp_docx, "w", zipfile.ZIP_DEFLATED) as z_out:
        for filename, data in unpacked_files.items():
            z_out.writestr(filename, data)
            
    # Atomic replace
    import shutil
    shutil.copy2(temp_docx, DOCX_PATH)
    shutil.rmtree(temp_dir)
    print(f"\n[SUCCESS] Successfully injected all 16 new images into: {DOCX_PATH}\n")

if __name__ == "__main__":
    inject_images()
