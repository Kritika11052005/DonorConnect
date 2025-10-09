// Create this as: components/IncomingRequestsModal.tsx

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X, Users, MapPin, Phone, Mail, Building2, AlertCircle, Check, XCircle, Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface IncomingRequestsModalProps {
  onClose: () => void;
}

export default function IncomingRequestsModal({ onClose }: IncomingRequestsModalProps) {
  const incomingRequests = useQuery(api.hospitals.getDetailedIncomingRequests);
  const acceptRequest = useMutation(api.hospitals.acceptOrganRequest);
  const rejectRequest = useMutation(api.hospitals.rejectOrganRequest);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [acceptMessage, setAcceptMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showAcceptDialog, setShowAcceptDialog] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);

  const handleAccept = async (requestId: string) => {
    setAcceptingId(requestId);
    try {
      await acceptRequest({
        requestId: requestId as any,
        message: acceptMessage || undefined,
      });
      setShowAcceptDialog(null);
      setAcceptMessage('');
      alert('Request accepted successfully! The requesting hospital has been notified.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to accept request');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setRejectingId(requestId);
    try {
      await rejectRequest({
        requestId: requestId as any,
        reason: rejectReason || undefined,
      });
      setShowRejectDialog(null);
      setRejectReason('');
      alert('Request declined. The requesting hospital has been notified.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setRejectingId(null);
    }
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Incoming Organ Requests</h2>
              <p className="text-sm text-gray-600">
                {incomingRequests?.length || 0} matching request{incomingRequests?.length !== 1 ? 's' : ''}
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
          {/* Requests List */}
          <div className="space-y-4">
            {incomingRequests === undefined ? (
              <div className="text-center py-8 text-gray-500">Loading requests...</div>
            ) : incomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No incoming requests at the moment</p>
                <p className="text-sm text-gray-500 mt-1">
                  Requests will appear here when other hospitals need organs you have available
                </p>
              </div>
            ) : (
              incomingRequests.map((request) => (
                <div
                  key={request._id}
                  className={`border-2 rounded-xl p-6 transition ${
                    request.urgency === 'critical'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                  }`}
                >
                  {/* Request Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          {request.requestingHospital?.hospitalName || 'Hospital'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </div>
                      
                      {request.requestingUser && (
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {request.requestingUser.city}, {request.requestingUser.state}
                          </div>
                          {request.requestingUser.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {request.requestingUser.phoneNumber}
                            </div>
                          )}
                          {request.requestingUser.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {request.requestingUser.email}
                            </div>
                          )}
                        </div>
                      )}
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

                  {/* Contact Information */}
                  {request.requestingUser && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-700 font-medium mb-2">HOSPITAL CONTACT</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {request.requestingUser.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{request.requestingUser.phoneNumber}</span>
                          </div>
                        )}
                        {request.requestingUser.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{request.requestingUser.email}</span>
                          </div>
                        )}
                        {request.requestingUser.address && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{request.requestingUser.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAcceptDialog(request._id)}
                      disabled={acceptingId === request._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      {acceptingId === request._id ? 'Accepting...' : 'Accept Request'}
                    </button>
                    <button
                      onClick={() => setShowRejectDialog(request._id)}
                      disabled={rejectingId === request._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      {rejectingId === request._id ? 'Declining...' : 'Decline'}
                    </button>
                  </div>

                  {/* Accept Dialog */}
                  {showAcceptDialog === request._id && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Accept this request?</h4>
                      <p className="text-sm text-green-800 mb-3">
                        You can add an optional message for the requesting hospital.
                      </p>
                      <textarea
                        value={acceptMessage}
                        onChange={(e) => setAcceptMessage(e.target.value)}
                        placeholder="Optional message (e.g., 'We will contact you within 24 hours to arrange the transfer')"
                        rows={2}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowAcceptDialog(null);
                            setAcceptMessage('');
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAccept(request._id)}
                          disabled={acceptingId === request._id}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                        >
                          Confirm Accept
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reject Dialog */}
                  {showRejectDialog === request._id && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Decline this request?</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        You can optionally provide a reason (will be shared with requesting hospital).
                      </p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Optional reason (e.g., 'Organ already allocated to another patient')"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowRejectDialog(null);
                            setRejectReason('');
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          disabled={rejectingId === request._id}
                          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                        >
                          Confirm Decline
                        </button>
                      </div>
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