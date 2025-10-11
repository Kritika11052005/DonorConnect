import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import CustomDropDown from './CustomDropDown';
export default function HospitalEditForm({ hospital, onComplete, onCancel }: { hospital: any; onComplete: () => void; onCancel: () => void }) {
  const updateHospital = useMutation(api.hospitals.updateHospitalProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: hospital.hospitalName,
    description: hospital.description,
    hospitalType: hospital.hospitalType as 'government' | 'private' | 'trust',
    totalBeds: hospital.totalBeds?.toString() || '',
    specializations: hospital.specializations || [],
    phoneNumber: hospital.user?.phoneNumber || '',
    address: hospital.user?.address || '',
    city: hospital.user?.city || '',
    state: hospital.user?.state || '',
    pincode: hospital.user?.pincode || '',
  });

  const specializationOptions = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology',
    'Radiology', 'Emergency Medicine', 'Surgery', 'Internal Medicine',
    'Gynecology', 'Dermatology', 'ENT', 'Ophthalmology', 'Nephrology',
    'Gastroenterology', 'Pulmonology', 'Urology', 'Psychiatry'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateHospital({
        hospitalId: hospital._id,
        hospitalName: formData.hospitalName,
        description: formData.description,
        hospitalType: formData.hospitalType,
        totalBeds: formData.totalBeds ? parseInt(formData.totalBeds) : undefined,
        specializations: formData.specializations,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });
      toast.success('Profile Updated!', {
        description: 'Your hospital profile has been updated successfully.',
      });
      onComplete();
    } catch (error) {
      toast.error('Update Failed', {
        description: error instanceof Error ? error.message : 'Failed to update hospital profile',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s: string) => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 mt-20">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Hospital Profile</h1>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Name
              </label>
              <input
                type="text"
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <CustomDropDown
  label="Hospital Type"
  value={formData.hospitalType}
  options={[
    { value: 'government', label: 'Government', description: 'Public healthcare facility' },
    { value: 'private', label: 'Private', description: 'Private healthcare facility' },
    { value: 'trust', label: 'Trust', description: 'Non-profit charitable organization' },
  ]}
  onChange={(value:any) => setFormData({ ...formData, hospitalType: value as any })}
  placeholder="Select hospital type"
/>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Beds
              </label>
              <input
                type="number"
                value={formData.totalBeds}
                onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specializations
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {specializationOptions.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialization(spec)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      formData.specializations.includes(spec)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
