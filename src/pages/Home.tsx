import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, Shield, Award, Users, TrendingUp } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { LandPlot, SearchFilters } from '../types';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';

const Home = () => {
  const [featuredProperties, setFeaturedProperties] = useState<LandPlot[]>([]);
  const { isAuthenticated, user } = useAuth();

  // Mock featured properties data
  useEffect(() => {
    loadFeaturedProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      const properties = await ApiService.getAvailablePlots();
      setFeaturedProperties(properties.slice(0, 6)); // Show first 6 properties
    } catch (error) {
      console.error('Error loading featured properties:', error);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    // Navigate to properties page with filters - this could be enhanced to pass filters
    window.location.href = '/properties';
  };

  const stats = [
    { icon: Users, label: 'Happy Clients', value: '2,500+' },
    { icon: MapPin, label: 'Properties Listed', value: '1,800+' },
    { icon: Award, label: 'Awards Won', value: '15+' },
    { icon: TrendingUp, label: 'Years Experience', value: '10+' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Properties',
      description: 'All properties are thoroughly verified and come with proper documentation.',
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Find your perfect plot with our advanced location-based search system.',
    },
    {
      icon: Award,
      title: 'Expert Support',
      description: 'Get professional guidance throughout your property investment journey.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Discover Premium Land <br />
                <span className="text-secondary-300">Across Tanzania</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
                Your trusted partner for finding and purchasing verified land plots with clear documentation and transparent processes.
              </p>
            </motion.div>

            {isAuthenticated ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-8"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 inline-block">
                  <p className="text-lg">
                    Welcome back, <span className="font-semibold text-secondary-300">{user?.firstName}!</span>
                  </p>
                  <p className="text-primary-100">Ready to find your next investment?</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center mb-8"
              >
                <Link
                  to="/register"
                  className="block sm:inline-block bg-secondary-600 text-white px-8 py-4 rounded-lg hover:bg-secondary-700 transition-colors font-semibold text-lg"
                >
                  Get Started Today
                </Link>
                <Link
                  to="/properties"
                  className="block sm:inline-block bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg hover:bg-white/20 transition-colors font-semibold text-lg border border-white/20"
                >
                  Browse Properties
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-secondary-400/20 rounded-full animate-bounce-gentle"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-accent-400/20 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Plot</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Use our advanced search to filter properties by location, size, price, and intended use to find exactly what you're looking for.
            </p>
          </div>
          
          <SearchBar onSearch={handleSearch} className="max-w-6xl mx-auto" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="bg-primary-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Properties</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our hand-picked selection of premium land plots across Tanzania, each verified and ready for investment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/properties"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center space-x-2 font-medium"
            >
              <span>View All Properties</span>
              <Search className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TanzLand?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We provide a secure, transparent, and efficient platform for land investments with comprehensive support throughout your journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="text-center p-6 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-primary-100 w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Investment Journey?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of satisfied clients who have found their perfect land plots through our platform.
          </p>
          
          {!isAuthenticated ? (
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link
                to="/register"
                className="block sm:inline-block bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
              >
                Create Your Account
              </Link>
              <Link
                to="/contact"
                className="block sm:inline-block bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg hover:bg-white/20 transition-colors font-semibold text-lg border border-white/20"
              >
                Contact Us Today
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg inline-block"
            >
              Go to Your Dashboard
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;