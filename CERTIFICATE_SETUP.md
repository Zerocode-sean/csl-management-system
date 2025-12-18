# Certificate Template Setup Guide

## EMESA Research and Consultancy Certificate

### Features of the New Certificate Template:

✅ **Professional Design**
- Elegant gold double border with corner decorations
- Beautiful gradient background (blue to purple)
- Modern typography with proper spacing
- Watermark with "EMESA" text

✅ **Branding**
- "EMESA Research and Consultancy" as institution name
- Subtitle: "Excellence in Education & Professional Development"
- Certificate of Achievement header

✅ **Logo Integration**
- Logo displays in top-left corner (100x100px)
- Automatically converts your logo to base64 for PDF embedding
- Falls back gracefully if logo not found

✅ **Security Features**
- QR code for verification (bottom-right)
- Unique CSL Certificate Number (top-right)
- Corner decorative elements
- Watermark

---

## How to Add Your Logo

### Step 1: Prepare Your Logo
1. Make sure your logo file is in **PNG format** (recommended)
2. Recommended size: **500x500 pixels** or larger (square format works best)
3. Transparent background is preferred
4. File name: `logo.png`

### Step 2: Place Logo in Root Folder
1. Copy your logo file
2. Paste it in the root folder of the project:
   ```
   C:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\logo.png
   ```

### Step 3: Rebuild and Restart Backend
After adding the logo, recompile and restart the backend:

```powershell
# Copy the updated files to Docker
docker cp backend\src\services\PDFService.ts csl-backend-dev-v3:/app/src/services/PDFService.ts
docker cp backend\src\templates\certificate.html csl-backend-dev-v3:/app/src/templates/certificate.html

# Compile TypeScript
docker exec csl-backend-dev-v3 npx tsc src/services/PDFService.ts --outDir dist/services --module commonjs --esModuleInterop --resolveJsonModule --skipLibCheck --target es2020

# Copy logo to Docker container
docker cp logo.png csl-backend-dev-v3:/app/logo.png

# Restart backend
docker restart csl-backend-dev-v3
```

---

## Certificate Template Details

### Colors Used:
- **Primary Blue**: `#1e3c72` (Institution name, signature lines)
- **Secondary Blue**: `#2a5298` (Course name)
- **Gold**: `#c9a961` (Borders, title, decorative elements)
- **Background Gradient**: Blue to Purple gradient

### Typography:
- **Headings**: Georgia, Times New Roman (serif)
- **Institution Name**: Arial (sans-serif)
- **CSL Number**: Courier New (monospace)

### Layout:
- A4 Landscape format (297mm × 210mm)
- 90% width, 88% height container
- Proper spacing and margins
- Responsive to content length

---

## Customization Options

### Change Institution Name:
Edit line 333 in `certificate.html`:
```html
<div class="institution-name">EMESA Research and Consultancy</div>
```

### Change Subtitle:
Edit line 334:
```html
<div class="institution-subtitle">Excellence in Education & Professional Development</div>
```

### Change Signature Titles:
Edit lines 378-379:
```html
<div class="signature-title">Program Director</div>
```

### Change Colors:
Modify the CSS variables in the `<style>` section:
- Line 25: Background gradient
- Line 129: Institution name color
- Line 190: Gold border color

---

## Testing the Certificate

1. Login to the system (admin@csl.com)
2. Go to **Certificates** page
3. Click **Issue Certificate**
4. Select a student and course
5. Click **Issue Certificate**
6. Click the **Download PDF** button on the certificate

The generated PDF will include:
- Your EMESA logo (top-left)
- Student name
- Course details
- Certificate number
- QR code for verification
- Signatures

---

## Troubleshooting

### Logo Not Showing?
- Check file name is exactly `logo.png` (lowercase)
- Check file is in root folder: `/app/logo.png` in Docker
- Check file is PNG format
- Restart backend after adding logo

### Certificate Not Generating?
- Check Docker logs: `docker logs csl-backend-dev-v3 --tail 50`
- Verify template file exists: `backend/src/templates/certificate.html`
- Check PDFService is compiled: `docker exec csl-backend-dev-v3 ls -la dist/services/PDFService.js`

### Wrong Template Showing?
- Clear browser cache
- Restart backend container
- Verify correct template path in PDFService.ts

---

## Preview

The certificate will look like:

```
╔═══════════════════════════════════════════════════════════════╗
║  [LOGO]                                          Cert No: XXX ║
║                                                                ║
║              EMESA RESEARCH AND CONSULTANCY                    ║
║         Excellence in Education & Professional Development     ║
║                                                                ║
║                      CERTIFICATE                               ║
║                    of Achievement                              ║
║                                                                ║
║                 This is to certify that                        ║
║                                                                ║
║                    STUDENT NAME                                ║
║                    ─────────────                               ║
║                                                                ║
║     has successfully completed the requirements and            ║
║             demonstrated proficiency in:                       ║
║                                                                ║
║                    COURSE NAME                                 ║
║                  Course Code: CS101                            ║
║                                                                ║
║  Issued: Jan 1, 2024    Student ID: XXX    Completed: Date    ║
║                                                                ║
║  ─────────────────        ─────────────────                   ║
║  Program Director         Chief Executive Officer              ║
║                                                      [QR CODE] ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Support

If you need help customizing the certificate further:
1. Check the HTML template: `backend/src/templates/certificate.html`
2. Check the PDF service: `backend/src/services/PDFService.ts`
3. Review Docker logs for errors
4. Test with a simple certificate first

The certificate is fully customizable through HTML/CSS in the template file!
