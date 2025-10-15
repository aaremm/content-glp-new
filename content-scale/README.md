# Content Scale - Asset Library

> Organized asset library for content scaling across multiple formats and platforms.

## 📁 Structure

```
content-scale/
├── src/                    # Source files and scripts
├── assets/                 # Organized media assets
│   ├── blog/              # Blog post images (800x500+)
│   ├── reels/             # Instagram Reels (9:16, 1080x1920)
│   ├── stories/           # Social media stories (9:16, 1080x1920)
│   ├── articles/          # Editorial content images (1200x630+)
│   └── global/            # Shared brand assets (logos, backgrounds)
├── package.json           # Package configuration
└── cursor.json            # Project configuration
```

## 🎯 Asset Categories

### Blog (`assets/blog/`)
**Purpose**: Images for blog posts and inline content  
**Formats**: JPG, PNG, WebP  
**Dimensions**: 800x500px or larger  
**Aspect Ratio**: 16:10 or 8:5 recommended  

**Usage**:
- Hero images for blog posts
- Inline content images
- Featured images
- Thumbnail previews

---

### Reels (`assets/reels/`)
**Purpose**: Short-form vertical video content  
**Formats**: MP4, MOV, JPG (thumbnails), PNG  
**Dimensions**: 1080x1920px (9:16)  
**Duration**: 15-60 seconds  

**Usage**:
- Instagram Reels
- TikTok videos
- YouTube Shorts
- Vertical video content

---

### Stories (`assets/stories/`)
**Purpose**: Ephemeral social media story content  
**Formats**: JPG, PNG, MP4  
**Dimensions**: 1080x1920px (9:16)  
**Duration**: 3-15 seconds (video)  

**Usage**:
- Instagram Stories
- Facebook Stories
- Snapchat Stories
- Temporary content

---

### Articles (`assets/articles/`)
**Purpose**: Long-form editorial and article content  
**Formats**: JPG, PNG, WebP  
**Dimensions**: 1200x630px or larger  
**Aspect Ratio**: 16:9 or 1.91:1 recommended  

**Usage**:
- Article headers
- Editorial content
- News pieces
- Long-form journalism

---

### Global (`assets/global/`)
**Purpose**: Shared assets used across all content types  
**Formats**: SVG (preferred), PNG, JPG  
**Dimensions**: Various  

**Usage**:
- Brand logos
- Watermarks
- Background patterns
- UI elements
- Icons and graphics

---

## 📊 Recommended Specifications

### Image Quality
- **Web**: 72-150 DPI
- **Print**: 300 DPI
- **Format**: JPG for photos, PNG for graphics with transparency, WebP for optimized web

### File Sizes
- **Blog**: < 500KB per image
- **Stories/Reels**: < 4MB for images, < 30MB for video
- **Articles**: < 1MB per image
- **Global**: SVG preferred (scalable), PNG < 200KB

### Naming Conventions
```
blog-post-pinecore-health-benefits-001.jpg
reel-summer-celebration-thumbnail.jpg
story-product-launch-frame-1.png
article-wellness-trends-hero.jpg
global-logo-primary.svg
```

## 🚀 Usage

### Adding New Assets

1. **Choose the correct category** based on content type
2. **Optimize images** before adding (compress, resize)
3. **Use descriptive names** following the naming convention
4. **Add to the appropriate folder**

### Integration with Content Generation

The asset library integrates with the main application's content generation system:

```javascript
// Example: Loading blog assets
const blogAssets = import.meta.glob('/content-scale/assets/blog/*.{png,jpg,jpeg}');

// Example: Loading reel thumbnails
const reelAssets = import.meta.glob('/content-scale/assets/reels/*.{png,jpg,jpeg}');
```

## 📝 Best Practices

1. **Organize by content type** - Keep assets in their designated folders
2. **Use consistent naming** - Follow the naming conventions
3. **Optimize before upload** - Compress images to reduce file size
4. **Version control** - Use descriptive commit messages when adding assets
5. **Clean up regularly** - Remove unused or outdated assets
6. **Document custom assets** - Add notes for special-purpose images

## 🔧 Maintenance

### Regular Tasks
- [ ] Review and remove unused assets monthly
- [ ] Optimize large files
- [ ] Update global assets when branding changes
- [ ] Archive old campaign assets
- [ ] Maintain consistent naming

### Asset Audit
Run quarterly audits to:
- Check for duplicate files
- Verify file formats and sizes
- Ensure proper categorization
- Update documentation

## 📖 Related Documentation

- [Main Project README](../README.md)
- [Content Generation Guide](../CONTENT_GENERATION_GUIDE.md)
- [Pinecore Images Guide](../PINECORE_IMAGES_GUIDE.md)

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Maintained By**: Content Team





