import React, { useState, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateBMI } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import axios from "axios";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const UpdateProfile = memo(({ user, setUser, setShowEditModal }) => {
  // Initialize form state with stable values using function initialization
  const [formData, setFormData] = useState(() => ({
    age: user?.age?.toString() || "",
    height: user?.height?.toString() || "",
    weight: user?.weight?.toString() || "",
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize BMI calculation to prevent unnecessary recalculations
  const currentBMI = useMemo(() => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height) / 100; // Convert cm to meters
    if (!isNaN(weight) && !isNaN(height) && height > 0 && weight > 0) {
      return (weight / (height * height)).toFixed(2);
    }
    return null;
  }, [formData.weight, formData.height]);

  // Memoize the input change handler
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Memoize the submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate inputs
    const age = parseFloat(formData.age);
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);

    if (!age || !height || !weight) {
      toast.error("All fields are required and must be valid numbers");
      return;
    }

    if (age <= 0 || height <= 0 || weight <= 0) {
      toast.error("Values must be greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUserData = {
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        bmi: currentBMI,
      };

      const response = await axios.patch(
        "/api/v1/user/updateUser",
        updatedUserData,
        { withCredentials: true }
      );

      if (response.data?.user) {
        setUser(response.data.user);
        toast.success("Profile updated successfully!");
        setShowEditModal(false);
      } else {
        throw new Error("User data missing in response");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
      console.error("Update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, currentBMI, setUser, setShowEditModal]);

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 m-4"
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Edit Profile
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="age" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Age
          </label>
          <Input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            min="1"
            max="150"
            className="mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter your age"
          />
        </div>

        <div>
          <label 
            htmlFor="height" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Height (cm)
          </label>
          <Input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleInputChange}
            min="1"
            step="0.1"
            className="mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter your height in cm"
          />
        </div>

        <div>
          <label 
            htmlFor="weight" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Weight (kg)
          </label>
          <Input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleInputChange}
            min="1"
            step="0.1"
            className="mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter your weight in kg"
          />
        </div>

        {currentBMI && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            Current BMI: <span className="font-semibold">{currentBMI}</span>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowEditModal(false)}
            disabled={isSubmitting}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className={`bg-gradient-to-r from-red-500 to-orange-500 text-white
              ${isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:from-red-600 hover:to-orange-600'}`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Updating...
              </span>
            ) : (
              "Update Profile"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
});

UpdateProfile.displayName = 'UpdateProfile';

export { UpdateProfile };