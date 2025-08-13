import React from 'react';
import { MapPin, Ruler, Building, ShoppingCart } from 'lucide-react';
import { LandPlot } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface PropertyCardProps {
  property: LandPlot;
  className?: string;
}

const PropertyCard = ({ property, className = '' }: PropertyCardProps) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (isAuthenticated) {
      addToCart(property);
    }
  };

  const getUsageIcon = (usage: string) => {
    switch (usage) {
      case 'business':
        return <Building className="h-4 w-4" />;
      case 'residential':
        return <Building className="h-4 w-4" />;
      case 'economic':
        return <Building className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const getUsageColor = (usage: string) => {
    switch (usage) {
      case 'business':
        return 'bg-primary-100 text-primary-800';
      case 'residential':
        return 'bg-secondary-100 text-secondary-800';
      case 'economic':
        return 'bg-accent-100 text-accent-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-16 w-16 text-primary-300" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            property.status === 'available' 
              ? 'bg-secondary-500 text-white' 
              : property.status === 'reserved'
              ? 'bg-accent-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {property.title}
          </h3>
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getUsageColor(property.usage)}`}>
            {getUsageIcon(property.usage)}
            <span className="ml-1 capitalize">{property.usage}</span>
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">
            {property.location.council}, {property.location.district}, {property.location.region}
          </span>
        </div>

        {/* Area */}
        <div className="flex items-center text-gray-600 mb-4">
          <Ruler className="h-4 w-4 mr-1" />
          <span className="text-sm">
            {property.area.toLocaleString()} m² ({property.size.width}m × {property.size.length}m)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary-600">
            {formatPrice(property.price)}
          </div>
          
          {isAuthenticated && property.status === 'available' && (
            <button
              onClick={handleAddToCart}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-1">
              {property.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {feature}
                </span>
              ))}
              {property.features.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{property.features.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PropertyCard;