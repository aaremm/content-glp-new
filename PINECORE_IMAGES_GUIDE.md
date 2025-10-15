# Pinecore Images Integration Guide

## 📸 Overview

The application now automatically uses images from the `public/pinecore-images/` folder for inline content generation. When ChatGPT generates content with image suggestions, it will randomly select from your Pinecore product images instead of using generic placeholders.

## 🚀 Quick Start

### Step 1: Add Your Images

1. Navigate to: `public/pinecore-images/`
2. Copy your Pinecore product images into this folder
3. Supported formats: PNG, JPG, JPEG, GIF, WebP, SVG

### Step 2: Start the Application

```bash
npm run dev
```

### Step 3: Generate Content

1. Use the chat interface to generate content (e.g., "Benefits of Pinecore drink")
2. Scroll to the inline image suggestion
3. Click "Generate Image"
4. Your Pinecore images will be randomly selected and displayed!

## 📁 Folder Structure

```
public/pinecore-images/
├── README.md                      # Instructions
├── .gitkeep                       # Keeps folder in git
├── pinecore-bottle-hero.jpg       # Your images go here
├── pinecore-lifestyle-beach.jpg
├── pinecore-ingredients.png
└── ... (add more images)
```

## 🎯 How It Works

### 1. **Automatic Image Loading**
- On app startup, the system scans `public/pinecore-images/`
- All image files are automatically detected and loaded
- Console log shows: `"Loaded X Pinecore images"`

### 2. **Smart Image Selection**
- When you click "Generate Image" in content
- System randomly picks from your Pinecore images
- Each generation can show a different image

### 3. **Required Images**
- Pinecore images are **required** for image generation
- If NO images found: Button is disabled with error message
- User is prompted to add images to the folder

## 🔍 Debugging

### Check Browser Console

Open browser DevTools (F12) and look for:

```javascript
// On app load:
"Loaded 5 Pinecore images: ['/pinecore-images/image1.jpg', ...]"

// On image generation:
"Using Pinecore image 3 of 5: /pinecore-images/pinecore-lifestyle.jpg"

// If no images found:
"No Pinecore images found. Add images to public/pinecore-images/ folder."
```

### Troubleshooting

**Problem**: "No Pinecore images found" or button is disabled
- **Solution**: Make sure images are in `public/pinecore-images/` folder
- Check file extensions are supported (.png, .jpg, .jpeg, .gif, .webp, .svg)
- Restart the dev server after adding images
- You will see a red error message under the disabled button

**Problem**: Images not displaying
- **Solution**: Check browser console for errors
- Verify image paths in console logs
- Ensure images are not too large (< 2MB recommended)

**Problem**: Button shows alert "No Pinecore images available"
- **Solution**: This means the image generation requires Pinecore images
- Add at least one image to `public/pinecore-images/` folder
- Refresh the page after adding images

## 📊 Best Practices

### Image Specifications
- **Resolution**: 800x500px or higher recommended
- **Aspect Ratio**: 16:9 or 8:5 works best
- **File Size**: Keep under 2MB for performance
- **Format**: JPG for photos, PNG for graphics with transparency

### Naming Conventions
```
pinecore-product-bottle.jpg
pinecore-lifestyle-beach.jpg
pinecore-ingredients-closeup.png
pinecore-benefits-infographic.jpg
```

### Image Variety
Include different types:
- ✅ Product shots (bottles, packaging)
- ✅ Lifestyle images (people using product)
- ✅ Ingredient close-ups
- ✅ Infographics and charts
- ✅ Brand/logo images

## 🔧 Technical Details

### Code Implementation

**Location**: `src/components/ContentArea.tsx`

**Key Functions**:
```typescript
// Loads images on component mount
useEffect(() => {
  const imageModules = import.meta.glob('/public/pinecore-images/*.{png,jpg,jpeg,gif,webp,svg}');
  // ... converts to usable paths
});

// Selects random image on generation
handleGenerateImage(keywords, imageId) {
  if (pinecoreImages.length > 0) {
    const randomIndex = Math.floor(Math.random() * pinecoreImages.length);
    imageUrl = pinecoreImages[randomIndex];
  } else {
    // fallback to Picsum
  }
}
```

### State Management
```typescript
const [pinecoreImages, setPinecoreImages] = useState<string[]>([]);
```

## 🎨 Example Workflow

1. **User**: Generates blog post about "Pinecore health benefits"
2. **System**: Creates content with inline image suggestion
3. **User**: Clicks "Generate Image" button
4. **System**: 
   - Checks `pinecoreImages` array (5 images loaded)
   - Randomly selects image #3: `pinecore-lifestyle.jpg`
   - Displays image inline with content
5. **Result**: Professional Pinecore product image appears in blog post!

## 📝 Example Images to Add

Recommended starter set:
1. `pinecore-bottle-hero.jpg` - Main product shot
2. `pinecore-lifestyle-active.jpg` - Person drinking after workout
3. `pinecore-ingredients.png` - Ingredient breakdown
4. `pinecore-benefits-infographic.jpg` - Health benefits chart
5. `pinecore-product-lineup.jpg` - Multiple product variants

## ✅ Checklist

- [ ] Created `public/pinecore-images/` folder
- [ ] Added 5+ product images to folder
- [ ] Verified image formats are supported
- [ ] Checked image file sizes (< 2MB each)
- [ ] Started dev server
- [ ] Checked console for "Loaded X Pinecore images"
- [ ] Generated content with inline images
- [ ] Clicked "Generate Image" button
- [ ] Confirmed Pinecore images appear inline

## 🎉 Success!

When everything works:
- ✅ Console shows image count on load
- ✅ "Generate Image" button works
- ✅ Your Pinecore images appear in content
- ✅ Different images on each generation
- ✅ Professional, branded content output

---

**Need Help?** Check the browser console for detailed logging and error messages.

