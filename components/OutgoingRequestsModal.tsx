// Create this as: components/OutgoingRequestsModal.tsx

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X, Send, Edit2, Trash2, AlertCircle, Calendar, User, Heart, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OutgoingRequestsModalProps {
  onClose: () => void;
}

export default function OutgoingRequestsModal({ onClose }: OutgoingRequestsModalProps) {
  const outgoingRequests = useQuery(api.hospitals.getOutgoingOrganRequests);
  const updateRequest = useMutation(api.hospitals.updateOrganTransplantRequest);
  const deleteRequest = useMutation(api.hospitals.deleteOrganTransplantRequest);

  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    urgency: 'normal' as 'critical' | 'urgent' | 'normal',
    patientAge: '',
    additionalDetails: '',
  });

  const resetForm = () => {
    setFormData({
      urgency: 'normal',
      patientAge: '',
      additionalDetails: '',
    });
    setEditingRequest(null);
  };

  const handleEdit = (request: any) => {
    setEditingRequest(request);
    setFormData({
      urgency: request.urgency,
      patientAge: request.patientAge.toString(),
      additionalDetails: request.additionalDetails || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateRequest({
        requestId: editingRequest._id,
        urgency: formData.urgency,
        patientAge: parseInt(formData.patientAge),
        additionalDetails: formData.additionalDetails || undefined,
      });
      toast.success('Request updated successfully', {
        description: 'Your organ request has been updated.',
      });
      resetForm();
    } catch (error) {
      toast.error('Failed to update request', {
        description: error instanceof Error ? error.message : 'Failed to update request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    toast('Are you sure you want to delete this request?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          const loadingToast = toast.loading('Deleting request...');
          try {
            await deleteRequest({ requestId: requestId as any });
            toast.success('Request deleted successfully', {
              id: loadingToast,
            });
          } catch (error) {
            toast.error('Failed to delete request', {
              id: loadingToast,
              description: error instanceof Error ? error.message : 'Failed to delete request',
            });
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-700';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Outgoing Requests</h2>
              <p className="text-sm text-gray-600">
                {outgoingRequests?.length || 0} request{outgoingRequests?.length !== 1 ? 's' : ''} sent
              </p>
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
          {/* Edit Form */}
          {editingRequest && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Request
              </h3>
              <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Organ Type:</p>
                    <p className="font-semibold capitalize">{editingRequest.organType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Blood Group:</p>
                    <p className="font-semibold">{editingRequest.patientBloodGroup}</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Request'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Requests List */}
          <div className="space-y-4">
            {outgoingRequests === undefined ? (
              <div className="text-center py-8 text-gray-500">Loading requests...</div>
            ) : outgoingRequests.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No outgoing requests yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create a request to find matching organs from other hospitals
                </p>
              </div>
            ) : (
              outgoingRequests.map((request) => (
                <div
                  key={request._id}
                  className={`border-2 rounded-xl p-6 transition ${
                    request.urgency === 'critical'
                      ? 'border-red-300 bg-red-50'
                      : request.status === 'matched'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {/* Request Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                          {request.organType} Request
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">ORGAN TYPE</p>
                      <p className="font-semibold text-gray-900 capitalize">{request.organType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">BLOOD GROUP</p>
                      <p className="font-semibold text-gray-900">{request.patientBloodGroup}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">PATIENT AGE</p>
                      <p className="font-semibold text-gray-900">{request.patientAge} years</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">REQUESTED ON</p>
                      <p className="font-semibold text-gray-900">
                        {format(request.createdAt, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {request.additionalDetails && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-1">ADDITIONAL DETAILS</p>
                      <p className="text-sm text-gray-700">{request.additionalDetails}</p>
                    </div>
                  )}

                  {/* Status Message */}
                  {request.status === 'matched' && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ This request has been matched! A hospital will contact you soon.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {request.status === 'open' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(request)}
                        disabled={!!editingRequest}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Request
                      </button>
                      <button
                        onClick={() => handleDelete(request._id)}
                        disabled={!!editingRequest}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Request
                      </button>
                    </div>
                  )}

                  {request.status !== 'open' && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      This request is {request.status} and cannot be edited
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}