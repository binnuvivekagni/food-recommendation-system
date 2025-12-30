import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaStar, FaDollarSign, FaClock, FaDirections, FaMapMarkerAlt, FaPhone, FaGlobe, FaUser } from "react-icons/fa";

export function FoodDetails({ food }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!food) return;

    const foodName = Object.values(food)[0];

    const fetchRestaurants = async () => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await axios.get("/api/v1/nearby/restaurants", {
              params: { latitude, longitude, foodItem: foodName },
              withCredentials: true,
            });

            const restaurantData = Array.isArray(response?.data?.restaurants?.data)
              ? response.data.restaurants.data
              : [];

            if (restaurantData.length > 0) {
              setRestaurants(restaurantData);
            } else {
              setError("No restaurants found.");
            }
          } catch (err) {
            setError("Failed to load restaurants.");
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError("Failed to retrieve location.");
          setLoading(false);
        }
      );
    };

    fetchRestaurants();
  }, [food]);

  const PriceLevel = ({ level }) => (
    <div className="flex items-center gap-1">
      {[...Array(3)].map((_, index) => (
        <FaDollarSign
          key={index}
          className={cn(
            "text-sm",
            index < level 
              ? "text-green-500 dark:text-green-400" 
              : "text-gray-300 dark:text-gray-600"
          )}
        />
      ))}
    </div>
  );

  const Rating = ({ rating }) => (
    <div className="flex items-center gap-1">
      <FaStar className="text-yellow-400" />
      <span className="font-medium">{rating || "N/A"}</span>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
            <span className="text-3xl">🍽️</span>
            <span>Restaurants serving {Object.values(food)[0]}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader className="animate-spin h-8 w-8 text-red-500" />
              <p className="text-gray-500 dark:text-gray-400">Finding nearby restaurants...</p>
            </div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center"
            >
              <p>{error}</p>
            </motion.div>
          ) : restaurants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-500 dark:text-gray-400">No restaurants found in your area.</p>
            </motion.div>
          ) : (
            // Scrollable Container
            <div className="relative">
              <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700">
                <AnimatePresence>
                  {restaurants.map((restaurant, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <Card 
                        className={cn(
                          "overflow-hidden transition-all duration-300",
                          "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750",
                          "border border-gray-200 dark:border-gray-700",
                          "shadow-md hover:shadow-xl rounded-xl"
                        )}
                      >
                        <div className="p-4 space-y-4">
                          {restaurant.photoUrl && (
                            <div className="relative h-48 overflow-hidden rounded-lg">
                              <img
                                src={restaurant.photoUrl}
                                alt={restaurant.name}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                              />
                              {restaurant.is_open && (
                                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                  Open Now
                                </div>
                              )}
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {restaurant.name}
                              </h3>
                              <Rating rating={restaurant.rating} />
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <PriceLevel level={restaurant.price_level} />
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                restaurant.is_open 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}>
                                {restaurant.is_open ? "Open Now" : "Closed"}
                              </span>
                            </div>

                            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                              <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                              <p>{restaurant.address}</p>
                            </div>

                            <div className="flex items-center gap-3 pt-3">
                              <a
                                href={restaurant.directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-300"
                              >
                                <FaDirections />
                                <span>Directions</span>
                              </a>
                              {restaurant.phone && (
                                <a
                                  href={`tel:${restaurant.phone}`}
                                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-300"
                                >
                                  <FaPhone />
                                </a>
                              )}
                              {restaurant.website && (
                                <a
                                  href={restaurant.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-300"
                                >
                                  <FaGlobe />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}