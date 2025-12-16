# Kael-OS Website

Official website for Kael-OS - A high-performance local AI desktop application built with Rust and Tauri.

## 🌐 Live Site

**Production**: https://kael-os.dev (GitHub Pages)  
**Repository**: https://github.com/leetheorc/Kael-OS-AI

## 📁 Structure

```
website/
├── index.html          # Homepage with hero, features, screenshots
├── docs.html          # Documentation hub (installation, quick start, API)
├── download.html      # Download page (all platforms, install methods)
├── about.html         # About page (mission, team, roadmap)
├── style.css          # Unified styles for all pages
├── script.js          # Interactive features and animations
├── install.sh         # Auto-installer script for Arch Linux
├── README.md          # This file
├── downloads/         # Binary releases (managed by CI/CD)
├── pkgbuild/          # PKGBUILD files for Arch Linux
└── docs/              # Additional documentation files
```

## 🎨 Design

- **Theme**: Dark purple gradient with blue accents
- **Framework**: Vanilla HTML/CSS/JS (no dependencies)
- **Responsive**: Mobile-first design with flexbox and grid
- **Accessibility**: Semantic HTML, proper ARIA labels
- **Performance**: Optimized assets, minimal JavaScript

## 🚀 Deployment

### GitHub Pages (Recommended)

1. **Push to repository**:

   ```bash
   git add website/
   git commit -m "Update website"
   git push origin main
   ```

2. **Configure GitHub Pages**:

   - Go to repository Settings → Pages
   - Source: Deploy from `main` branch
   - Folder: `/website`
   - Custom domain (optional): `kael-os.dev`

3. **DNS Configuration** (if using custom domain):
   ```
   A     @     185.199.108.153
   A     @     185.199.109.153
   A     @     185.199.110.153
   A     @     185.199.111.153
   CNAME www   leetheorc.github.io
   ```

### Local Development

```bash
# Navigate to website directory
cd website/

# Serve with Python
python -m http.server 8000

# Or with Node.js
npx http-server -p 8000

# Open browser
xdg-open http://localhost:8000
```

## 📝 Content Management

### Adding New Pages

1. Create new HTML file in `website/`
2. Copy navigation and footer from existing pages
3. Add page-specific content
4. Link from navigation menu in all pages
5. Update this README

### Updating Downloads

Binary releases are automatically uploaded by GitHub Actions to:

- `website/downloads/kael-os-arch.pkg.tar.zst`
- `website/downloads/kael-os-linux.tar.gz`
- `website/downloads/Kael-OS.AppImage`

Manual upload:

```bash
cp ../path/to/build/kael-os-arch.pkg.tar.zst downloads/
git add downloads/
git commit -m "Update Arch package"
git push
```

### Updating Documentation

Edit `docs.html` directly or link to markdown docs in `/docs` directory.

## 🎯 Features

### Homepage (index.html)

- Animated gradient hero section
- Feature cards with hover effects
- Screenshot gallery (placeholder images)
- Community links (GitHub, Discord)
- Newsletter subscription form
- Download quick links
- Enhanced footer

### Documentation (docs.html)

- Installation guides for all platforms
- Quick start tutorial
- Configuration examples
- API reference links
- Code examples with syntax highlighting

### Download (download.html)

- Platform-specific instructions (Arch, Linux, AppImage)
- Build from source guide
- System requirements
- Quick install commands
- Next steps after installation

### About (about.html)

- Project mission and vision
- Philosophy cards (Privacy, Speed, Offline-first)
- Technology stack
- Arch Linux focus explanation
- Development team info
- Roadmap timeline
- Community contribution guide

## 🛠️ Technologies

- **HTML5**: Semantic markup
- **CSS3**: Modern features (Grid, Flexbox, Custom Properties)
- **JavaScript**: Vanilla ES6+ (no frameworks)
- **GitHub Pages**: Static hosting
- **GitHub Actions**: Automated deployment

## 🔧 Customization

### Colors

Edit CSS variables in `style.css`:

```css
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --accent-purple: #8b5cf6;
  --accent-blue: #3b82f6;
  /* ... */
}
```

### Navigation

Update nav links in all HTML files:

```html
<ul class="nav-links">
  <li><a href="index.html">Home</a></li>
  <li><a href="docs.html">Docs</a></li>
  <!-- ... -->
</ul>
```

### Content

All content is in HTML files - no build process needed. Edit directly and refresh browser.

## 📊 Analytics (Optional)

Add to `<head>` of each page for tracking:

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
</script>
```

## 🐛 Known Issues

- Screenshot placeholders need real images
- Newsletter form needs backend integration (Mailchimp/SendGrid)
- Discord invite link placeholder (update with real link)
- Download links point to GitHub releases (verify paths)

## 🤝 Contributing

To contribute to the website:

1. Fork the repository
2. Create a feature branch: `git checkout -b website-improvements`
3. Make your changes in `website/`
4. Test locally with a development server
5. Commit: `git commit -m "Improve website: [description]"`
6. Push: `git push origin website-improvements`
7. Create a Pull Request

## 📄 License

MIT License - see [LICENSE](../LICENSE) file

## 🔗 Links

- **Main Repository**: https://github.com/leetheorc/Kael-OS-AI
- **Documentation**: https://kael-os.dev/docs.html
- **Download**: https://kael-os.dev/download.html
- **Discord**: https://discord.gg/kael-os (update with real link)

---

**Last Updated**: December 16, 2025  
**Maintainer**: [@leetheorc](https://github.com/leetheorc)
