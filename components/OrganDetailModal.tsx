// Create this as: components/OrganDetailsModal.tsx

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X, Plus, Edit2, Trash2, Heart, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
interface OrganDetailsModalProps {
  onClose: () => void;
}

export default function OrganDetailsModal({ onClose }: OrganDetailsModalProps) {
  const organDetails = useQuery(api.hospitals.getDetailedOrganAvailability);
  const addOrgan = useMutation(api.hospitals.addOrganAvailability);
  const updateOrgan = useMutation(api.hospitals.updateOrganAvailability);
  const deleteOrgan = useMutation(api.hospitals.deleteOrganAvailability);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrgan, setEditingOrgan] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    organType: '',
    bloodGroup: 'A+' as any,
    quantity: '1',
    availableUntil: '',
    donorAge: '',
    notes: '',
  });

  const organTypes = [
    'Heart', 'Kidney', 'Liver', 'Lungs', 'Pancreas',
    'Intestine', 'Cornea', 'Skin', 'Bone', 'Heart Valve'
  ];

  const resetForm = () => {
    setFormData({
      organType: '',
      bloodGroup: 'A+',
      quantity: '1',
      availableUntil: '',
      donorAge: '',
      notes: '',
    });
    setEditingOrgan(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    if (editingOrgan) {
      await updateOrgan({
        organId: editingOrgan._id,
        quantity: parseInt(formData.quantity),
        availableUntil: new Date(formData.availableUntil).getTime(),
        notes: formData.notes || undefined,
      });
      toast.success('Organ updated successfully', {
        description: 'The organ record has been updated.',
      });
    } else {
      await addOrgan({
        organType: formData.organType,
        bloodGroup: formData.bloodGroup,
        quantity: parseInt(formData.quantity),
        availableUntil: new Date(formData.availableUntil).getTime(),
        donorAge: formData.donorAge ? parseInt(formData.donorAge) : undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Organ added successfully', {
        description: 'The new organ record has been added.',
      });
    }
    resetForm();
  } catch (error) {
    toast.error('Failed to save organ', {
      description: error instanceof Error ? error.message : 'Failed to save organ',
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleEdit = (record: any) => {
    setEditingOrgan(record);
    setFormData({
      organType: record.organType,
      bloodGroup: record.bloodGroup,
      quantity: (record.quantity || 1).toString(),
      availableUntil: format(record.availableUntil, 'yyyy-MM-dd'),
      donorAge: record.donorAge?.toString() || '',
      notes: record.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (organId: string) => {
  toast('Are you sure you want to delete this organ record?', {
    description: 'This action cannot be undone.',
    action: {
      label: 'Delete',
      onClick: async () => {
        const loadingToast = toast.loading('Deleting organ...');
        try {
          await deleteOrgan({ organId: organId as any });
          toast.success('Organ deleted successfully', {
            id: loadingToast,
          });
        } catch (error) {
          toast.error('Failed to delete organ', {
            id: loadingToast,
            description: error instanceof Error ? error.message : 'Failed to delete organ',
          });
        }
      },
    },
    cancel: {
      label: 'Cancel',
      onClick: () => {}, // No-op handler to satisfy Action type
    },
  });
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Organ Inventory</h2>
              <p className="text-sm text-gray-600">Manage available organs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Add Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Organ
            </button>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingOrgan ? 'Edit Organ Record' : 'Add New Organ'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organ Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      disabled={!!editingOrgan}
                      value={formData.organType}
                      onChange={(e) => setFormData({ ...formData, organType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select organ</option>
                      {organTypes.map((organ) => (
                        <option key={organ} value={organ}>{organ}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      disabled={!!editingOrgan}
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
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
                      Quantity <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Until <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.availableUntil}
                      onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donor Age (Optional)
                    </label>
                    <input
                      type="number"
                      disabled={!!editingOrgan}
                      min="0"
                      max="120"
                      value={formData.donorAge}
                      onChange={(e) => setFormData({ ...formData, donorAge: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingOrgan ? 'Update' : 'Add Organ'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Organ List */}
          <div className="space-y-4">
            {organDetails === undefined ? (
              <div className="text-center py-8 text-gray-500">Loading organs...</div>
            ) : organDetails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No organs available. Click "Add Organ" to add one.
              </div>
            ) : (
              organDetails.map((group, index) => (
                <div key={index} className="border rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {group.organType}
                        <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {group.bloodGroup}
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* Status Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-600 font-medium">Available</p>
                      <p className="text-2xl font-bold text-green-700">{group.available}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-xs text-yellow-600 font-medium">Allocated</p>
                      <p className="text-2xl font-bold text-yellow-700">{group.allocated}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">Transplanted</p>
                      <p className="text-2xl font-bold text-blue-700">{group.transplanted}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium">Expired</p>
                      <p className="text-2xl font-bold text-gray-700">{group.expired}</p>
                    </div>
                  </div>

                  {/* Individual Records */}
                  <div className="space-y-2">
                    {group.records.map((record: any) => (
                      <div
                        key={record._id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              record.status === 'available' ? 'bg-green-100 text-green-700' :
                              record.status === 'allocated' ? 'bg-yellow-100 text-yellow-700' :
                              record.status === 'transplanted' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {record.status.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3" />
                              Until: {format(record.availableUntil, 'MMM dd, yyyy')}
                            </span>
                            {record.donorAge && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <User className="w-3 h-3" />
                                Age: {record.donorAge}
                              </span>
                            )}
                            {record.quantity && record.quantity > 1 && (
                              <span className="text-gray-600">Qty: {record.quantity}</span>
                            )}
                          </div>
                          {record.notes && (
                            <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                          )}
                        </div>
                        {record.status === 'available' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-2 hover:bg-gray-200 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}