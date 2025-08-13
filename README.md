# TanzLand - Real Estate Platform

A modern, professional real estate platform for Tanzania, built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### Frontend Features
- **Modern React Application** with TypeScript and Tailwind CSS
- **Responsive Design** optimized for all devices
- **User Authentication** with registration and login
- **Property Search & Filtering** by location, price, area, and usage
- **Shopping Cart System** for property reservations
- **User Dashboard** with order history and notifications
- **Role-based Access Control** (User, Admin, Master Admin)
- **Partner Application System** for property sellers
- **Professional UI/UX** with smooth animations and micro-interactions

### Backend Integration
- **Supabase Database** with PostgreSQL
- **Real-time Data Synchronization**
- **Row Level Security (RLS)** for data protection
- **File Storage** for property images and documents
- **Email Notifications** for orders and updates

### Core Functionality
- **Property Management** - Browse, search, and filter land plots
- **User Management** - Registration, authentication, and profiles
- **Order System** - Cart functionality and order processing
- **Admin Panel** - Property upload and management (coming soon)
- **Notification System** - Real-time updates for users
- **Tanzania-specific** - Region/District/Council location format

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for build tooling

### Backend & Database
- **Supabase** (PostgreSQL database)
- **Row Level Security** for data protection
- **Real-time subscriptions**
- **Authentication & Authorization**

### Deployment Ready
- **Vercel** deployment configuration
- **Environment variables** setup
- **Production optimizations**

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd tanzland-platform
pnpm install
```

### 2. Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
1. In your Supabase dashboard, go to SQL Editor
2. Run the migration file: `supabase/migrations/create_users_and_properties.sql`
3. This will create all necessary tables, policies, and sample data

### 4. Run Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## 🗄 Database Schema

### Core Tables
- **profiles** - Extended user profiles with roles
- **land_plots** - Property listings with detailed information
- **cart_items** - Shopping cart functionality
- **orders** - Order management and tracking
- **notifications** - System notifications

### User Roles
- **user** - Regular users who can browse and purchase
- **admin** - Can upload and manage properties
- **master_admin** - Full system control and user management

### Property Status
- **available** - Listed and available for purchase
- **reserved** - In someone's cart or pending payment
- **sold** - Successfully sold and no longer available

## 🔐 Authentication & Security

### Features
- Email/password authentication via Supabase Auth
- Row Level Security (RLS) policies
- Role-based access control
- Secure API endpoints
- Data validation and sanitization

### Default Accounts
The system creates default admin accounts (configured in migration):
- Master Admin: `master@tanzland.co.tz`
- System Admin: `admin@tanzland.co.tz`

*Note: You'll need to create these users through Supabase Auth and update the profiles table with the correct UUIDs.*

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main branch

### Environment Variables
```env
# Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## 📱 Usage Guide

### For Users
1. **Register** - Create account with email and password
2. **Browse Properties** - Search and filter available land plots
3. **Add to Cart** - Reserve properties you're interested in
4. **Checkout** - Create orders and receive payment instructions
5. **Dashboard** - Track orders and manage account

### For Admins (Coming Soon)
1. **Property Upload** - Add new land plots with details
2. **Order Management** - Process and update order status
3. **User Management** - View and manage user accounts

### For Master Admin (Coming Soon)
1. **Full System Control** - Manage all aspects of the platform
2. **Role Assignment** - Grant admin privileges to users
3. **Analytics Dashboard** - View platform statistics and performance

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── context/            # React context providers
├── lib/               # Utility libraries (Supabase client)
├── pages/             # Page components
├── services/          # API service functions
├── types/             # TypeScript type definitions
└── App.tsx            # Main application component
```

### Key Components
- **Header** - Navigation with authentication
- **PropertyCard** - Property display component
- **SearchBar** - Advanced property search
- **Dashboard** - User account management
- **Cart** - Shopping cart functionality

### API Services
- **ApiService** - Centralized API calls to Supabase
- **Authentication** - User login/registration
- **Property Management** - CRUD operations for properties
- **Order Processing** - Cart and order management

## 🎨 Design System

### Colors
- **Primary**: Blue (#2563EB) - Trust and professionalism
- **Secondary**: Green (#059669) - Growth and success
- **Accent**: Orange (#EA580C) - Energy and action
- **Status Colors**: Success, warning, error states

### Typography
- **Font**: Inter - Modern, readable sans-serif
- **Hierarchy**: Clear heading and body text scales
- **Spacing**: 8px grid system for consistent layouts

### Components
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG compliant components
- **Animations** - Smooth transitions and micro-interactions

## 🔮 Future Enhancements

### Phase 2 Features
- **Admin Panel** - Complete property and user management
- **Payment Integration** - Stripe/M-Pesa payment processing
- **Document Management** - Upload and verify property documents
- **Map Integration** - Interactive property location maps
- **Advanced Search** - GIS-based location search

### Phase 3 Features
- **Mobile App** - React Native mobile application
- **Property Valuation** - AI-powered property pricing
- **Virtual Tours** - 360° property viewing
- **Investment Analytics** - ROI calculations and market insights
- **Multi-language** - Swahili and English support

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For technical support or questions:
- Email: support@tanzland.co.tz
- Documentation: [Coming Soon]
- Issues: Create GitHub issue for bugs or feature requests

---

**TanzLand** - Empowering Tanzanians to own land through transparent, secure, and accessible real estate solutions.