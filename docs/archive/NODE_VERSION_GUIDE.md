# Node Version Configuration Guide

## The Problem
`@sveltejs/vite-plugin-svelte@6.1.3` has specific Node version requirements:
- ✅ `^20.19` - Node 20.19 or higher in v20 series
- ✅ `^22.12` - Node 22.12 or higher in v22 series  
- ✅ `>=24` - Node 24 or higher
- ❌ **Node 23 is NOT supported** (falls in the gap)

## Platform Constraints

### Nixpacks/Coolify
- `nodejs_20` → Provides v20.19+ ✅ **WORKS**
- `nodejs_22` → Provides v22.11.0 ❌ (too old, needs 22.12+)
- `nodejs_23` → Provides v23.x ❌ (not supported by package)
- `nodejs_24` → Not available yet ❌

### Docker
- `node:20-alpine` → v20.19.4 ✅ **WORKS**
- `node:22-alpine` → v22.18.0 ✅ **WORKS** 
- `node:23-alpine` → v23.x ❌ (not supported)
- `node:24-alpine` → Not available yet ❌

## Current Configuration

### For Nixpacks/Coolify Deployment
- **nixpacks.toml**: Uses `nodejs_20` (LTS, stable)
- **.nvmrc**: Set to `20`
- **package.json**: Allows `>=20.19.0 || >=22.12.0`

### For Docker Deployment  
- **Dockerfile**: Uses `node:22-alpine` (latest compatible)
- Works because Docker's Node 22 is v22.18.0 (meets ^22.12)

## Why This Split Configuration?
1. **Nixpacks limitation**: Can't specify minor versions, stuck with v22.11.0
2. **Package requirement**: Needs v22.12+ for Node 22 series
3. **Solution**: Use Node 20 for Nixpacks, Node 22 for Docker

## Deployment Commands

### Coolify (uses Nixpacks)
```bash
git push  # Triggers auto-deploy with Node 20
```

### Docker (manual or CI/CD)
```bash
docker build -t app .  # Uses Node 22
docker run -p 3000:3000 app
```

## Future Updates
When Nixpacks updates to Node 22.12+ or Node 24 becomes available, we can unify the configuration.