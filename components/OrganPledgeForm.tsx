import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X, Heart, AlertCircle, Phone, User, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrganPledgeFormProps {
  onClose: () => void;
}

const AVAILABLE_ORGANS = [
  'Heart',
  'Kidneys',
  'Liver',
  'Lungs',
  'Pancreas',
  'Small Intestine',
  'Corneas',
  'Skin',
  'Bone',
  'Heart Valves',
  'Blood Vessels',
  'Connective Tissue',
];

export default function OrganPledgeForm({ onClose }: OrganPledgeFormProps) {
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  // Get existing pledge
  const existingPledge = useQuery(api.organDonation.getMyPledge);

  // Mutations
  const createOrganPledge = useMutation(api.organDonation.createPledge);
  const updateOrganPledge = useMutation(api.organDonation.updatePledge);
  const revokeOrganPledge = useMutation(api.organDonation.revokePledge);
  const updateDonorOrganStatus = useMutation(api.donors.updateOrganDonorStatus);

  const isEditMode = !!existingPledge;

  // Populate form with existing pledge data
  useEffect(() => {
    if (existingPledge) {
      setSelectedOrgans(existingPledge.organs.map((o: string) => 
        o.charAt(0).toUpperCase() + o.slice(1)
      ));
      setMedicalHistory(existingPledge.medicalHistory || '');
      setEmergencyContactName(existingPledge.emergencyContactName || '');
      setEmergencyContactPhone(existingPledge.emergencyContactPhone || '');
    }
  }, [existingPledge]);

  const toggleOrgan = (organ: string) => {
    setSelectedOrgans(prev =>
      prev.includes(organ)
        ? prev.filter(o => o !== organ)
        : [...prev, organ]
    );
  };

  const handleRevokePledge = async () => {
    if (!existingPledge) return;

    setIsSubmitting(true);
    setError('');
    setShowRevokeDialog(false);

    try {
      await revokeOrganPledge({
        pledgeId: existingPledge._id,
      });

      // Update donor's organ donor status
      await updateDonorOrganStatus({
        isOrganDonor: false,
        organDonorPledgeDate: undefined,
      });

      toast.success('Pledge Revoked Successfully', {
        description: 'Your organ donation pledge has been cancelled.',
        duration: 4000,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke pledge');
      toast.error('Revocation Failed', {
        description: err.message || 'Unable to revoke your pledge. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (selectedOrgans.length === 0) {
        throw new Error('Please select at least one organ to donate');
      }

      if (!emergencyContactName || !emergencyContactPhone) {
        throw new Error('Please provide emergency contact information');
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(emergencyContactPhone.replace(/\s+/g, ''))) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      if (isEditMode && existingPledge) {
        // Update existing pledge
        await updateOrganPledge({
          pledgeId: existingPledge._id,
          organs: selectedOrgans.map(o => o.toLowerCase()),
          medicalHistory: medicalHistory || undefined,
          emergencyContactName,
          emergencyContactPhone,
        });

        toast.success('Pledge Updated Successfully! 🎉', {
          description: 'Your organ donation pledge has been updated.',
          duration: 4000,
        });
      } else {
        // Create new pledge
        const pledgeDate = Date.now();

        await createOrganPledge({
          organs: selectedOrgans.map(o => o.toLowerCase()),
          pledgeDate,
          medicalHistory: medicalHistory || undefined,
          emergencyContactName,
          emergencyContactPhone,
          status: 'active',
        });

        // Update donor's organ donor status
        await updateDonorOrganStatus({
          isOrganDonor: true,
          organDonorPledgeDate: pledgeDate,
        });

        toast.success('Pledge Registered Successfully! 🎉', {
          description: 'Thank you for your noble decision to save lives.',
          duration: 5000,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'register'} organ donation pledge`);
      toast.error(`${isEditMode ? 'Update' : 'Registration'} Failed`, {
        description: err.message || 'Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? 'Update Organ Donation Pledge' : 'Organ Donation Pledge'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditMode ? 'Modify your organ donation details' : 'Give the gift of life'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isEditMode && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Editing Existing Pledge</p>
                <p className="text-sm text-blue-800">You're updating your current organ donation pledge.</p>
              </div>
            </div>
          )}

          <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-pink-900 mb-2">Important Information:</h3>
            <ul className="text-sm text-pink-800 space-y-1">
              <li>• One organ donor can save up to 8 lives</li>
              <li>• Your decision is completely voluntary and revocable</li>
              <li>• Medical professionals will honor your wishes</li>
              <li>• Your family will be consulted at the time of donation</li>
            </ul>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Select Organs to Donate <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_ORGANS.map((organ) => (
                <button
                  key={organ}
                  type="button"
                  onClick={() => toggleOrgan(organ)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    selectedOrgans.includes(organ)
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isSubmitting}
                >
                  {organ}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {selectedOrgans.length} organ{selectedOrgans.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Medical History (Optional)
            </label>
            <textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Please list any significant medical conditions, surgeries, or medications..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">This information helps medical teams assess organ viability</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency Contact Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Full name of emergency contact"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> By submitting this pledge, you agree that your organs may be donated after death
              for transplantation purposes. This pledge can be {isEditMode ? 'updated or ' : ''}revoked at any time through your dashboard.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            {isEditMode && (
              <button
                type="button"
                onClick={handleRevokePledge}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4" />
                Revoke Pledge
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Registering...') 
                : (isEditMode ? 'Update Pledge' : 'Register Pledge')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}