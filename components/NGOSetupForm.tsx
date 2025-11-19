'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Building2, X, Upload, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

interface NGOSetupFormProps {
  userId: Id<"users">;
  onComplete: () => void;
  isEditMode?: boolean;
  existingData?: {
    organizationName: string;
    registrationNumber: string;
    description: string;
    categories: string[];
    logo?: string;
    websiteUrl?: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const CATEGORY_OPTIONS = [
  'Education',
  'Health',
  'Environment',
  'Animal Welfare',
  'Child Welfare',
  'Women Empowerment',
  'Poverty Alleviation',
  'Disaster Relief',
  'Community Development',
  'Arts & Culture',
  'Sports',
  'Other',
];

type FormData = {
  organizationName: string;
  registrationNumber: string;
  description: string;
  categories: string[];
  logo: string;
  websiteUrl: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export default function NGOSetupForm({ userId, onComplete, isEditMode = false, existingData }: NGOSetupFormProps) {
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    registrationNumber: '',
    description: '',
    categories: [],
    logo: '',
    websiteUrl: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfile = useMutation(api.ngos.updateNgoProfile);

  // Pre-populate form data in edit mode
  useEffect(() => {
    if (isEditMode && existingData) {
      setFormData({
        organizationName: existingData.organizationName || '',
        registrationNumber: existingData.registrationNumber || '',
        description: existingData.description || '',
        categories: existingData.categories || [],
        logo: existingData.logo || '',
        websiteUrl: existingData.websiteUrl || '',
        phoneNumber: existingData.phoneNumber || '',
        address: existingData.address || '',
        city: existingData.city || '',
        state: existingData.state || '',
        pincode: existingData.pincode || '',
      });
    }
  }, [isEditMode, existingData]);

  const validateForm = () => {
    if (!formData.organizationName.trim()) {
      toast.error('Organization Name Required');
      return false;
    }

    if (!formData.registrationNumber.trim()) {
      toast.error('Registration Number Required');
      return false;
    }

    if (!formData.description.trim()) {
      toast.error('Description Required');
      return false;
    }

    if (formData.description.length < 50) {
      toast.error('Description must be at least 50 characters');
      return false;
    }

    if (formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error('Phone Number Required');
      return false;
    }

    if (!/^[+]?[0-9\s-]{10,}$/.test(formData.phoneNumber)) {
      toast.error('Invalid Phone Number');
      return false;
    }

    if (!formData.address.trim()) {
      toast.error('Address Required');
      return false;
    }

    if (!formData.city.trim()) {
      toast.error('City Required');
      return false;
    }

    if (!formData.state.trim()) {
      toast.error('State Required');
      return false;
    }

    if (!formData.pincode.trim()) {
      toast.error('Pincode Required');
      return false;
    }

    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return false;
    }

    if (formData.websiteUrl && !/^https?:\/\/.+/.test(formData.websiteUrl)) {
      toast.error('Invalid Website URL (must start with http:// or https://)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile({
        userId,
        organizationName: formData.organizationName,
        registrationNumber: formData.registrationNumber,
        description: formData.description,
        categories: formData.categories,
        logo: formData.logo || undefined,
        websiteUrl: formData.websiteUrl || undefined,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });

      toast.success(
        isEditMode ? 'Profile Updated!' : 'Setup Complete!',
        {
          description: isEditMode
            ? 'Your NGO profile has been successfully updated.'
            : 'Welcome! Your NGO profile is now complete.',
        }
      );

      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Update Failed', {
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {isEditMode ? 'Edit NGO Profile' : 'Complete NGO Setup'}
                </h2>
                <p className="text-green-100 mt-1">
                  {isEditMode
                    ? 'Update your organization information'
                    : 'Please provide your organization details to continue'}
                </p>
              </div>
            </div>
            {isEditMode && (
              <button
              aria-label="oncomplete"
                onClick={onComplete}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Organization Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-green-200 pb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-500" />
              Organization Information
            </h3>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="e.g., Hope Foundation"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            {/* Registration Number */}
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number *</Label>
              <Input
                id="registrationNumber"
                type="text"
                placeholder="e.g., REG123456"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="border-green-200 focus:border-green-500 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500">Government-issued registration number</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Organization Description * 
                <span className="text-xs text-gray-500 ml-2">
                  ({formData.description.length}/50 minimum)
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your organization's mission, vision, and activities..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="border-green-200 focus:border-green-500 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <Label>Organization Categories * (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORY_OPTIONS.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                      formData.categories.includes(category)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-transparent shadow-md'
                        : 'bg-green-50 text-gray-700 border-green-200 hover:border-green-400'
                    }`}
                  >
                    {formData.categories.includes(category) && (
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                    )}
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo URL (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="logo" className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-green-500" />
                Organization Logo URL (Optional)
              </Label>
              <Input
                id="logo"
                type="url"
                placeholder="https://example.com/logo.png"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="border-green-200 focus:border-green-500 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500">Provide a direct link to your logo image</p>
            </div>

            {/* Website URL (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-green-500" />
                Website URL (Optional)
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://www.example.org"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4 border-t-2 border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-green-200 pb-2">
              Contact Information
            </h3>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Office Address *</Label>
              <Input
                id="address"
                type="text"
                placeholder="Building No, Street Name"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="e.g., Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="e.g., Maharashtra"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                type="text"
                placeholder="400001"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                pattern="[0-9]{6}"
                maxLength={6}
                className="border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t-2 border-gray-200 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12 text-lg shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Setting up...'}
                </>
              ) : (
                isEditMode ? 'Update Profile' : 'Complete Setup'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}