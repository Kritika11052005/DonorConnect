// Organ Request Form Component
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X, Radio } from 'lucide-react';
import { toast } from 'sonner';
import CustomDropDown from './CustomDropDown';

export default function OrganRequestForm({ onClose }: { onClose: () => void }) {
  const createRequest = useMutation(api.hospitals.createOrganTransplantRequest);
  const hospitals = useQuery(api.hospitals.getOtherHospitals);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<'broadcast' | 'specific'>('broadcast');
  const [formData, setFormData] = useState({
    organType: '',
    patientBloodGroup: 'A+' as any,
    urgency: 'normal' as 'critical' | 'urgent' | 'normal',
    patientAge: '',
    additionalDetails: '',
    targetHospitalId: undefined as string | undefined,
  });

  const organTypes = [
    'Heart', 'Kidney', 'Liver', 'Lungs', 'Pancreas', 
    'Intestine', 'Cornea', 'Skin', 'Bone', 'Heart Valve'
  ];

  const handleRequestTypeChange = (type: 'broadcast' | 'specific') => {
    setRequestType(type);
    if (type === 'broadcast') {
      setFormData({ ...formData, targetHospitalId: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (requestType === 'specific' && !formData.targetHospitalId) {
      toast.error('Please select a hospital', {
        description: 'You must select a specific hospital for targeted requests.',
      });
      return;
    }

    if (formData.organType && formData.patientAge) {
      setIsSubmitting(true);
      try {
        await createRequest({
          organType: formData.organType,
          patientBloodGroup: formData.patientBloodGroup,
          urgency: formData.urgency,
          patientAge: parseInt(formData.patientAge),
          additionalDetails: formData.additionalDetails || undefined,
          targetHospitalId: requestType === 'broadcast' ? undefined : formData.targetHospitalId as any,
        });
        toast.success('Request submitted successfully', {
          description: requestType === 'broadcast' 
            ? 'Your request has been broadcast to all hospitals.'
            : 'Your request has been sent to the selected hospital.',
        });
        onClose();
      } catch (error) {
        toast.error('Failed to create request', {
          description: error instanceof Error ? error.message : 'Failed to create request',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const hospitalOptions = hospitals?.map(h => ({
    value: h._id,
    label: h.hospitalName,
    description: `${h.city}, ${h.state} • ${h.hospitalType}`,
  })) || [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Create Organ Transplant Request</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Request Type Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Request Type <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRequestTypeChange('broadcast')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                requestType === 'broadcast'
                  ? 'border-blue-500 bg-blue-100 shadow-md'
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  requestType === 'broadcast' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {requestType === 'broadcast' && (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Broadcast to All</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Send request to all hospitals
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRequestTypeChange('specific')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                requestType === 'specific'
                  ? 'border-blue-500 bg-blue-100 shadow-md'
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  requestType === 'specific' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {requestType === 'specific' && (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Specific Hospital</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Target a particular hospital
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Hospital Selection (only show if specific) */}
        {requestType === 'specific' && (
          <CustomDropDown
            label="Target Hospital"
            value={formData.targetHospitalId || ''}
            options={hospitalOptions}
            onChange={(value) => setFormData({ ...formData, targetHospitalId: value as string })}
            placeholder="Select a hospital"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomDropDown
            label="Organ Type"
            value={formData.organType}
            options={organTypes.map(organ => ({ value: organ, label: organ }))}
            onChange={(value) => setFormData({ ...formData, organType: value as string })}
            placeholder="Select organ"
          />

          <CustomDropDown
            label="Patient Blood Group"
            value={formData.patientBloodGroup}
            options={[
              { value: 'A+', label: 'A+ (Compatible with A+, AB+)' },
              { value: 'A-', label: 'A- (Compatible with A+, A-, AB+, AB-)' },
              { value: 'B+', label: 'B+ (Compatible with B+, AB+)' },
              { value: 'B-', label: 'B- (Compatible with B+, B-, AB+, AB-)' },
              { value: 'AB+', label: 'AB+ (Universal Recipient)' },
              { value: 'AB-', label: 'AB- (Compatible with AB+, AB-)' },
              { value: 'O+', label: 'O+ (Compatible with O+, A+, B+, AB+)' },
              { value: 'O-', label: 'O- (Universal Donor)' },
            ]}
            onChange={(value) => setFormData({ ...formData, patientBloodGroup: value as any })}
            placeholder="Select blood group"
          />

          <CustomDropDown
            label="Urgency"
            value={formData.urgency}
            options={[
              { value: 'normal', label: 'Normal', description: 'Standard priority' },
              { value: 'urgent', label: 'Urgent', description: 'High priority - within weeks' },
              { value: 'critical', label: 'Critical', description: 'Immediate attention required' },
            ]}
            onChange={(value: any) => setFormData({ ...formData, urgency: value as any })}
            placeholder="Select urgency level"
          />

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
            disabled={isSubmitting || !hospitals}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Request...' : 'Create Request'}
          </button>
        </div>
      </form>
    </div>
  );
}