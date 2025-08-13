# Deployment Guide - TanzLand Real Estate Platform

This guide covers the complete deployment process for the TanzLand platform, including frontend deployment to Vercel and database setup with Supabase.

## 🚀 Quick Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Frontend deployed to Vercel
- [ ] Domain configured (optional)
- [ ] SSL certificate active
- [ ] Testing completed

## 📋 Prerequisites

### Required Accounts
- [Supabase](https://supabase.com) account (free tier available)
- [Vercel](https://vercel.com) account (free tier available)
- [GitHub](https://github.com) account for code repository
- Domain name (optional, for custom domain)

### Required Tools
- Git
- Node.js 18+
- pnpm package manager

## 🗄 Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `tanzland-production` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users (e.g., `ap-southeast-1` for East Africa)
5. Click "Create new project"
6. Wait for project initialization (2-3 minutes)

### 2. Configure Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content from `supabase/migrations/create_users_and_properties.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the migration
6. Verify tables are created in **Table Editor**

### 3. Get API Credentials
1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. Save these securely - you'll need them for deployment

### 4. Configure Authentication
1. Go to **Authentication** > **Settings**
2. Configure email settings:
   - **Enable email confirmations**: Disabled (for easier testing)
   - **Enable email change confirmations**: Enabled
   - **Enable secure email change**: Enabled
3. Set up email templates (optional but recommended)
4. Configure redirect URLs for production domain

### 5. Set Up Row Level Security
The migration script automatically enables RLS and creates policies. Verify in **Authentication** > **Policies** that policies are active for all tables.

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Repository
1. Ensure your code is pushed to GitHub
2. Verify all dependencies are in `package.json`
3. Test the build locally:
   ```bash
   pnpm build
   ```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build` (or leave default)
   - **Output Directory**: `dist` (default)

### 3. Configure Environment Variables
1. In Vercel project settings, go to **Environment Variables**
2. Add the following variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Set environment to **Production, Preview, and Development**

### 4. Deploy
1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. Your app will be available at `https://your-project.vercel.app`

### 5. Custom Domain (Optional)
1. In Vercel project settings, go to **Domains**
2. Add your custom domain (e.g., `tanzland.co.tz`)
3. Configure DNS records as instructed by Vercel
4. SSL certificate will be automatically provisioned

## 🔧 Production Configuration

### Environment Variables
Create production environment variables in Vercel:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Optional: Analytics
VITE_GA_TRACKING_ID=your-google-analytics-id
```

### Supabase Production Settings
1. **Database**: Ensure connection pooling is enabled
2. **Auth**: Configure production redirect URLs
3. **Storage**: Set up buckets for property images
4. **Edge Functions**: Deploy any custom functions (future feature)

## 🧪 Testing Deployment

### 1. Functional Testing
- [ ] User registration works
- [ ] User login works
- [ ] Property browsing works
- [ ] Search functionality works
- [ ] Cart functionality works
- [ ] Order creation works
- [ ] Dashboard loads correctly

### 2. Performance Testing
- [ ] Page load times < 3 seconds
- [ ] Images load properly
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### 3. Security Testing
- [ ] HTTPS enabled
- [ ] API endpoints secured
- [ ] User data protected
- [ ] SQL injection prevention
- [ ] XSS protection

## 📊 Monitoring & Analytics

### 1. Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor performance metrics
3. Track user engagement

### 2. Supabase Monitoring
1. Monitor database performance in Supabase dashboard
2. Set up alerts for high usage
3. Review query performance

### 3. Error Tracking (Optional)
Consider integrating error tracking services:
- Sentry for error monitoring
- LogRocket for user session recording
- Google Analytics for user behavior

## 🔄 Continuous Deployment

### Automatic Deployments
Vercel automatically deploys when you push to your main branch:

1. **Production**: Deploys from `main` branch
2. **Preview**: Deploys from feature branches
3. **Development**: Local development environment

### Deployment Workflow
```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# Vercel automatically deploys
# Check deployment status in Vercel dashboard
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in Vercel
# Common fixes:
- Ensure all dependencies are in package.json
- Check TypeScript errors
- Verify environment variables
```

#### 2. Database Connection Issues
```bash
# Check Supabase credentials
# Verify RLS policies
# Check network connectivity
```

#### 3. Authentication Problems
```bash
# Verify Supabase Auth settings
# Check redirect URLs
# Confirm email settings
```

### Debug Commands
```bash
# Local development
pnpm dev

# Build locally
pnpm build

# Preview build
pnpm preview

# Check dependencies
pnpm audit
```

## 📈 Scaling Considerations

### Database Scaling
- Monitor Supabase usage in dashboard
- Upgrade to Pro plan when needed
- Consider read replicas for high traffic

### Frontend Scaling
- Vercel automatically scales
- Consider CDN for static assets
- Implement caching strategies

### Performance Optimization
- Enable Vercel Edge Functions
- Implement image optimization
- Use lazy loading for components
- Minimize bundle size

## 🔐 Security Best Practices

### Production Security
1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure proper CORS settings
4. **Rate Limiting**: Implement API rate limiting
5. **Input Validation**: Validate all user inputs
6. **Regular Updates**: Keep dependencies updated

### Supabase Security
1. **RLS Policies**: Ensure all tables have proper RLS
2. **API Keys**: Rotate keys regularly
3. **Database Access**: Limit database access
4. **Backup**: Regular database backups
5. **Monitoring**: Monitor for suspicious activity

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Monitor application performance
- [ ] Update dependencies monthly
- [ ] Review security logs
- [ ] Backup database regularly
- [ ] Test critical user flows
- [ ] Monitor error rates

### Getting Help
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Community**: GitHub Discussions for project-specific issues

---

## 🎉 Deployment Complete!

Your TanzLand platform is now live and ready for users. Remember to:

1. Test all functionality thoroughly
2. Monitor performance and errors
3. Set up regular backups
4. Plan for scaling as you grow
5. Keep security best practices in mind

**Your platform is now accessible at your Vercel URL or custom domain!**