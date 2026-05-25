# Deployment Guide - Unified SDLC Accelerator

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Modern web server (nginx, Apache, or cloud hosting)

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
```

This creates optimized files in the `dist/` directory.

## Production Deployment

### Option 1: Static File Hosting

The app is a single-page application (SPA) that can be deployed to any static hosting service.

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**netlify.toml** (add to project root):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**vercel.json** (add to project root):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### AWS S3 + CloudFront
```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 2: Docker Container

**Dockerfile** (add to project root):
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and run**:
```bash
docker build -t sdlc-accelerator .
docker run -p 8080:80 sdlc-accelerator
```

### Option 3: Kubernetes

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sdlc-accelerator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sdlc-accelerator
  template:
    metadata:
      labels:
        app: sdlc-accelerator
    spec:
      containers:
      - name: web
        image: your-registry/sdlc-accelerator:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: sdlc-accelerator
spec:
  selector:
    app: sdlc-accelerator
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

## Environment Configuration

### Development
```bash
# .env.development
VITE_API_URL=http://localhost:8000
VITE_ENV=development
```

### Production
```bash
# .env.production
VITE_API_URL=https://api.yourcompany.com
VITE_ENV=production
```

## Backend Integration (Future)

When connecting to a real backend:

1. **Update API endpoints** in a new `src/services/api.ts` file
2. **Add authentication** tokens to requests
3. **Configure CORS** on backend to allow frontend origin
4. **Update mock data calls** with real API calls
5. **Add error handling** for network failures
6. **Implement retry logic** for failed requests

Example API service structure:
```typescript
// src/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL;

export const agentService = {
  runAnalysis: async (agentId: string, documents: File[], config: any) => {
    const formData = new FormData();
    documents.forEach(doc => formData.append('files', doc));
    formData.append('config', JSON.stringify(config));
    
    const response = await fetch(`${API_BASE}/agents/${agentId}/run`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    return response.json();
  }
};
```

## Performance Optimization

### Build Optimization
Already configured in `vite.config.ts`:
- Code splitting
- Tree shaking
- Minification
- Gzip compression

### Additional Optimizations
```bash
# Analyze bundle size
npm run build -- --mode analyze

# Preview production build locally
npm run preview
```

### CDN Configuration
For maximum performance, serve static assets via CDN:

1. Upload `dist/assets/*` to CDN
2. Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: 'https://cdn.yourcompany.com/'
});
```

## Monitoring

### Recommended Tools
- **Sentry** - Error tracking
- **Google Analytics** - Usage analytics
- **LogRocket** - Session replay
- **New Relic** - Performance monitoring

### Health Check Endpoint
Add to nginx.conf:
```nginx
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

## Security Checklist

- [ ] HTTPS enabled (TLS 1.2+)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] CORS properly configured
- [ ] Authentication tokens stored securely (HTTP-only cookies)
- [ ] Regular dependency updates (`npm audit`)
- [ ] Rate limiting on API
- [ ] Input validation and sanitization

## Rollback Strategy

### Blue-Green Deployment
1. Keep previous version running
2. Deploy new version to separate environment
3. Switch traffic using load balancer
4. Monitor for errors
5. Rollback by switching back if needed

### Version Tags
```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

## Post-Deployment Verification

1. **Smoke Tests**
   - [ ] Landing page loads
   - [ ] Can select persona
   - [ ] Dashboard displays
   - [ ] Can navigate to agent workspace
   - [ ] Upload interface works
   - [ ] Results display correctly

2. **Accessibility Check**
   - [ ] Run Lighthouse audit (should score 95+)
   - [ ] Test keyboard navigation
   - [ ] Verify color contrast
   - [ ] Test with screen reader

3. **Performance Check**
   - [ ] Time to First Byte < 200ms
   - [ ] First Contentful Paint < 1.5s
   - [ ] Time to Interactive < 3s
   - [ ] Lighthouse Performance score 90+

## Troubleshooting

### White screen after deployment
- Check browser console for errors
- Verify correct base URL in vite.config.ts
- Ensure server redirects all routes to index.html

### 404 on page refresh
- Configure server to serve index.html for all routes
- Add redirect rules (see nginx.conf above)

### Slow load times
- Enable gzip compression
- Use CDN for static assets
- Check bundle size (should be ~320KB gzipped)

## Support

For deployment issues:
1. Check build logs
2. Review server logs
3. Test locally with production build
4. Contact DevOps team

---

**Last Updated**: January 2026  
**Maintained by**: SDLC Accelerator Team
