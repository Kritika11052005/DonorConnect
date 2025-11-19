'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { X, Calendar, DollarSign, Target, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';
import { DayPicker } from 'react-day-picker';
import { format, addYears } from 'date-fns';
import 'react-day-picker/dist/style.css';
import CustomDropdown from './CustomDropDown';

type Campaign = {
  _id: Id<"fundraisingCampaigns">;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'draft' | 'cancelled';
  raisedAmount: number;
  targetAmount: number;
  startDate: number;
  endDate?: number;
  category: string;
  totalDonors?: number;
};

type CampaignFormProps = {
  onClose: () => void;
  onSuccess: () => void;
  editingCampaign?: Campaign | null;
};

const CATEGORIES = [
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'Environment', label: 'Environment', icon: '🌱' },
  { value: 'Animal Welfare', label: 'Animal Welfare', icon: '🐾' },
  { value: 'Disaster Relief', label: 'Disaster Relief', icon: '🆘' },
  { value: 'Child Welfare', label: 'Child Welfare', icon: '👶' },
  { value: 'Women Empowerment', label: 'Women Empowerment', icon: '💪' },
  { value: 'Food & Nutrition', label: 'Food & Nutrition', icon: '🍎' },
  { value: 'Clean Water', label: 'Clean Water', icon: '💧' },
  { value: 'Community Development', label: 'Community Development', icon: '🏘️' },
  { value: 'Arts & Culture', label: 'Arts & Culture', icon: '🎨' },
  { value: 'Technology', label: 'Technology', icon: '💻' },
  { value: 'Other', label: 'Other', icon: '📋' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', icon: '✅', description: 'Campaign is currently accepting donations' },
  { value: 'draft', label: 'Draft', icon: '📝', description: 'Campaign is not yet published' },
  { value: 'completed', label: 'Completed', icon: '🎉', description: 'Campaign has reached its goal' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌', description: 'Campaign has been cancelled' }
];

export default function CampaignForm({ onClose, onSuccess, editingCampaign }: CampaignFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    category: '',
    endDate: undefined as Date | undefined,
    status: 'active' as 'active' | 'completed' | 'draft' | 'cancelled'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEndDateCalendar, setShowEndDateCalendar] = useState(false);

  const createCampaign = useMutation(api.ngos.createCampaign);
  const updateCampaign = useMutation(api.ngos.updateCampaign);

  useEffect(() => {
    if (editingCampaign) {
      setFormData({
        title: editingCampaign.title,
        description: editingCampaign.description,
        targetAmount: editingCampaign.targetAmount.toString(),
        category: editingCampaign.category,
        endDate: editingCampaign.endDate ? new Date(editingCampaign.endDate) : undefined,
        status: editingCampaign.status
      });
    }
  }, [editingCampaign]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    if (!formData.targetAmount) {
      newErrors.targetAmount = 'Target amount is required';
    } else {
      const amount = parseFloat(formData.targetAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.targetAmount = 'Please enter a valid amount';
      } else if (amount < 1000) {
        newErrors.targetAmount = 'Minimum target amount is ₹1,000';
      } else if (amount > 100000000) {
        newErrors.targetAmount = 'Maximum target amount is ₹10 crores';
      }
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (formData.endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (formData.endDate < today) {
        newErrors.endDate = 'End date cannot be in the past';
      }
      
      const oneYearFromNow = addYears(new Date(), 1);
      
      if (formData.endDate > oneYearFromNow) {
        newErrors.endDate = 'End date cannot be more than 1 year from now';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const targetAmount = parseFloat(formData.targetAmount);
      const endDate = formData.endDate ? formData.endDate.getTime() : undefined;

      if (editingCampaign) {
        await updateCampaign({
          campaignId: editingCampaign._id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          targetAmount,
          category: formData.category,
          endDate,
          status: formData.status
        });
        toast.success('Campaign updated successfully!');
      } else {
        await createCampaign({
          title: formData.title.trim(),
          description: formData.description.trim(),
          targetAmount,
          category: formData.category,
          endDate
        });
        toast.success('Campaign created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const maxDate = addYears(new Date(), 1);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {editingCampaign 
                ? 'Update your campaign details below' 
                : 'Fill in the details to launch your fundraising campaign'}
            </p>
          </div>
          <button
            aria-label="Close campaign form"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Campaign Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-green-500" />
              Campaign Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Help Build a School in Rural India"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-green-500" />
              Campaign Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your campaign goals, impact, and how the funds will be used..."
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Target Amount and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Target className="w-4 h-4 text-green-500" />
                Target Amount (₹) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  placeholder="50000"
                  min="1000"
                  step="1000"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.targetAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.targetAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.targetAmount}</p>
              )}
              {formData.targetAmount && !errors.targetAmount && (
                <p className="mt-1 text-xs text-gray-500">
                  ₹{parseFloat(formData.targetAmount).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Category */}
            <CustomDropdown
              label="Category *"
              value={formData.category}
              options={CATEGORIES.map(cat => ({
                value: cat.value,
                label: cat.label,
                icon: <span className="text-lg">{cat.icon}</span>
              }))}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, category: value as string }));
                if (errors.category) {
                  setErrors(prev => ({ ...prev, category: '' }));
                }
              }}
              placeholder="Select a category"
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* End Date and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* End Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-green-500" />
                Campaign End Date (Optional)
              </label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEndDateCalendar(!showEndDateCalendar)}
                  className="w-full justify-start text-left font-normal border-gray-300 hover:border-green-500 h-11"
                >
                  {formData.endDate ? (
                    format(formData.endDate, 'PPP')
                  ) : (
                    <span className="text-gray-500">Select end date</span>
                  )}
                </Button>
                
                {showEndDateCalendar && (
                  <div className="absolute z-[90] mt-2 bg-white border-2 border-green-200 rounded-xl shadow-2xl p-4">
                    <DayPicker
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => {
                        setFormData({ ...formData, endDate: date });
                        setShowEndDateCalendar(false);
                        if (errors.endDate) {
                          setErrors(prev => ({ ...prev, endDate: '' }));
                        }
                      }}
                      disabled={{ before: today, after: maxDate }}
                      modifiersStyles={{
                        selected: {
                          backgroundColor: '#10b981',
                          color: 'white',
                        },
                      }}
                    />
                    <div className="flex gap-2 mt-2 pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData({ ...formData, endDate: undefined });
                          setShowEndDateCalendar(false);
                        }}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowEndDateCalendar(false)}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Leave empty for ongoing campaigns
              </p>
            </div>

            {/* Status (only show when editing) */}
            {editingCampaign && (
              <CustomDropdown
                label="Campaign Status *"
                value={formData.status}
                options={STATUS_OPTIONS.map(opt => ({
                  value: opt.value,
                  label: opt.label,
                  icon: <span className="text-lg">{opt.icon}</span>,
                  description: opt.description
                }))}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, status: value as 'active' | 'completed' | 'draft' | 'cancelled' }));
                }}
                placeholder="Select status"
              />
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Campaign Guidelines
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Provide clear and detailed information about your campaign</li>
              <li>• Set a realistic fundraising goal</li>
              <li>• Explain how the funds will be utilized</li>
              <li>• Keep your campaign description honest and transparent</li>
              <li>• Update donors regularly on campaign progress</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {editingCampaign ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}