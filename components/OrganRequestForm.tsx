// Organ Request Form Component
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Building2, Heart, Activity, Users, Search, AlertCircle, MapPin, Star, Filter, Plus, Edit2, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

export default function OrganRequestForm({ onClose }: { onClose: () => void }) {
  const createRequest = useMutation(api.hospitals.createOrganTransplantRequest);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    organType: '',
    patientBloodGroup: 'A+' as any,
    urgency: 'normal' as 'critical' | 'urgent' | 'normal',
    patientAge: '',
    additionalDetails: '',
  });

  const organTypes = [
    'Heart', 'Kidney', 'Liver', 'Lungs', 'Pancreas', 
    'Intestine', 'Cornea', 'Skin', 'Bone', 'Heart Valve'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.organType && formData.patientAge) {
      setIsSubmitting(true);
      try {
        await createRequest({
          organType: formData.organType,
          patientBloodGroup: formData.patientBloodGroup,
          urgency: formData.urgency,
          patientAge: parseInt(formData.patientAge),
          additionalDetails: formData.additionalDetails || undefined,
        });
        onClose();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to create request');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Create Organ Transplant Request</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organ Type <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={formData.organType}
              onChange={(e) => setFormData({ ...formData, organType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select organ</option>
              {organTypes.map((organ) => (
                <option key={organ} value={organ}>{organ}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Blood Group <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={formData.patientBloodGroup}
              onChange={(e) => setFormData({ ...formData, patientBloodGroup: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Age <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              max="120"
              value={formData.patientAge}
              onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details
            </label>
            <textarea
              value={formData.additionalDetails}
              onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
              rows={3}
              placeholder="Any additional medical information or requirements..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Request...' : 'Create Request'}
          </button>
        </div>
      </form>
    </div>
  );
}