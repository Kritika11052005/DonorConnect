import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X, Activity, Calendar, User, Phone, Mail, MapPin, Clock, Check, XCircle, Edit2, Filter, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import DatePicker from './DatePicker';
import CustomDropDown from './CustomDropDown';
interface BloodDonationsModalProps {
  onClose: () => void;
}

export default function BloodDonationsModal({ onClose }: BloodDonationsModalProps) {
  const appointments = useQuery(api.bloodDonations.getHospitalBloodDonations);
  const completeAppointment = useMutation(api.bloodDonations.completeBloodDonation);
  const markAsMissed = useMutation(api.bloodDonations.markAppointmentMissed);
  const updateAppointment = useMutation(api.bloodDonations.updateBloodDonationAppointment);

  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'completed' | 'missed' | 'cancelled'>('all');
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState<string | null>(null);
  const [showMissedDialog, setShowMissedDialog] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [completionForm, setCompletionForm] = useState({
    completedAt: '',
    completedTime: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    completedAt: '',
    completedTime: '',
    notes: '',
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: 'completed' as any,
  });

  const [missedNotes, setMissedNotes] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'missed':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };
//eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredAppointments = appointments?.filter((apt: any) => {
    if (activeTab === 'all') return true;
    return apt.status === activeTab;
  });

  const statusCounts = {
    all: appointments?.length || 0,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    scheduled: appointments?.filter((a: any) => a.status === 'scheduled').length || 0,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    completed: appointments?.filter((a: any) => a.status === 'completed').length || 0,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    missed: appointments?.filter((a: any) => a.status === 'missed').length || 0,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    cancelled: appointments?.filter((a: any) => a.status === 'cancelled').length || 0,
  };

  const handleComplete = async (appointmentId: string) => {
    setIsSubmitting(true);
    try {
      const completedDateTime = completionForm.completedAt && completionForm.completedTime
        ? new Date(`${completionForm.completedAt}T${completionForm.completedTime}`).getTime()
        : Date.now();

      await completeAppointment({
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        appointmentId: appointmentId as any,
        completedAt: completedDateTime,
        notes: completionForm.notes || undefined,
      });

      toast.success('Blood donation marked as completed', {
        description: 'The donor record has been updated.',
      });

      setShowCompletionDialog(null);
      setCompletionForm({ completedAt: '', completedTime: '', notes: '' });
    } catch (error) {
      toast.error('Failed to mark as completed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkMissed = async (appointmentId: string) => {
    setIsSubmitting(true);
    try {
      await markAsMissed({
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        appointmentId: appointmentId as any,
        notes: missedNotes || undefined,
      });

      toast.success('Appointment marked as missed');
      setShowMissedDialog(null);
      setMissedNotes('');
    } catch (error) {
      toast.error('Failed to mark as missed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
//eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (appointment: any) => {
    setEditingAppointment(appointment);
    if (appointment.completedAt) {
      const date = new Date(appointment.completedAt);
      setEditForm({
        completedAt: format(date, 'yyyy-MM-dd'),
        completedTime: format(date, 'HH:mm'),
        notes: appointment.notes || '',
        status: appointment.status,
      });
    } else {
      setEditForm({
        completedAt: '',
        completedTime: '',
        notes: appointment.notes || '',
        status: appointment.status,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingAppointment) return;
    
    setIsSubmitting(true);
    try {
      const completedDateTime = editForm.completedAt && editForm.completedTime
        ? new Date(`${editForm.completedAt}T${editForm.completedTime}`).getTime()
        : undefined;

      await updateAppointment({
        appointmentId: editingAppointment._id,
        status: editForm.status,
        completedAt: completedDateTime,
        notes: editForm.notes || undefined,
      });

      toast.success('Appointment updated successfully');
      setEditingAppointment(null);
    } catch (error) {
      toast.error('Failed to update appointment', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCompletionDialog = (appointmentId: string) => {
    const now = new Date();
    setCompletionForm({
      completedAt: format(now, 'yyyy-MM-dd'),
      completedTime: format(now, 'HH:mm'),
      notes: '',
    });
    setShowCompletionDialog(appointmentId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Blood Donation Appointments</h2>
              <p className="text-sm text-gray-600">
                {appointments?.length || 0} total appointment{appointments?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
          aria-label='close'
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'all', label: 'All' },
              { key: 'scheduled', label: 'Scheduled' },
              { key: 'completed', label: 'Completed' },
              { key: 'missed', label: 'Missed' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                //eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts]})
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Appointments List */}
          <div className="space-y-4">
            {appointments === undefined ? (
              <div className="text-center py-8 text-gray-500">Loading appointments...</div>
            ) : filteredAppointments?.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No {activeTab !== 'all' ? activeTab : ''} appointments found</p>
              </div>
            ) : (
              filteredAppointments?.map((appointment) => (
                <div
                  key={appointment._id}
                  className="border-2 rounded-xl p-6 hover:shadow-md transition"
                >
                  {/* Appointment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          {appointment.donorUser?.name || 'Anonymous Donor'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>

                      {appointment.donorUser && (
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          {appointment.donor?.bloodGroup && (
                            <div className="flex items-center gap-1 font-semibold text-red-600">
                              <Activity className="w-4 h-4" />
                              {appointment.donor.bloodGroup}
                            </div>
                          )}
                          {appointment.donorUser.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {appointment.donorUser.phoneNumber}
                            </div>
                          )}
                          {appointment.donorUser.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {appointment.donorUser.email}
                            </div>
                          )}
                          {appointment.donorUser.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {appointment.donorUser.city}, {appointment.donorUser.state}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {(appointment.status === 'completed' || appointment.status === 'missed') && (
                      <button
                      aria-label="edit"
                        onClick={() => handleEdit(appointment)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">SCHEDULED DATE</p>
                      <p className="font-semibold text-gray-900">
                        {format(appointment.scheduledDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">SCHEDULED TIME</p>
                      <p className="font-semibold text-gray-900">{appointment.scheduledTime}</p>
                    </div>
                    {appointment.completedAt && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">COMPLETED DATE</p>
                          <p className="font-semibold text-gray-900">
                            {format(appointment.completedAt, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">COMPLETED TIME</p>
                          <p className="font-semibold text-gray-900">
                            {format(appointment.completedAt, 'HH:mm')}
                          </p>
                        </div>
                      </>
                    )}
                    {!appointment.completedAt && appointment.status !== 'scheduled' && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">CREATED ON</p>
                        <p className="font-semibold text-gray-900">
                          {format(appointment.createdAt, 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {appointment.notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-1">NOTES</p>
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons for Scheduled Appointments */}
                  {appointment.status === 'scheduled' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => openCompletionDialog(appointment._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => setShowMissedDialog(appointment._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Mark as Missed
                      </button>
                    </div>
                  )}

                  {/* Completion Dialog */}
                  {showCompletionDialog === appointment._id && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3">Mark donation as completed</h4>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <DatePicker
  value={completionForm.completedAt}
  onChange={(date) => setCompletionForm({ ...completionForm, completedAt: date })}
  maxDate={new Date()} // Only today or past
  label="Completion Date"
  required
/>
                        <div>
                          <label className="block text-sm font-medium text-green-900 mb-1">
                            Completion Time
                          </label>
                          <input
                          aria-label="completion time"
                            type="time"
                            value={completionForm.completedTime}
                            onChange={(e) => setCompletionForm({ ...completionForm, completedTime: e.target.value })}
                            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <textarea
                        value={completionForm.notes}
                        onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })}
                        placeholder="Add any notes about the donation (optional)"
                        rows={2}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-3"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowCompletionDialog(null);
                            setCompletionForm({ completedAt: '', completedTime: '', notes: '' });
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleComplete(appointment._id)}
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : 'Confirm Completion'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Missed Dialog */}
                  {showMissedDialog === appointment._id && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-2">Mark appointment as missed?</h4>
                      <p className="text-sm text-red-800 mb-3">
                        This will mark the appointment as missed. You can add optional notes.
                      </p>
                      <textarea
                        value={missedNotes}
                        onChange={(e) => setMissedNotes(e.target.value)}
                        placeholder="Optional notes (e.g., 'Donor did not show up')"
                        rows={2}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowMissedDialog(null);
                            setMissedNotes('');
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleMarkMissed(appointment._id)}
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : 'Confirm Missed'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {editingAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Appointment</h3>
                <button
                aria-label="close"
                  onClick={() => setEditingAppointment(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <CustomDropDown
  label="Status"
  value={editForm.status}
  options={[
    { value: 'scheduled', label: 'Scheduled', description: 'Appointment is scheduled' },
    { value: 'completed', label: 'Completed', description: 'Donation completed successfully' },
    { value: 'missed', label: 'Missed', description: 'Donor did not show up' },
    { value: 'cancelled', label: 'Cancelled', description: 'Appointment was cancelled' },
  ]}
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange={(value:any) => setEditForm({ ...editForm, status: value as any })}
  placeholder="Select status"
/>

                {editForm.status === 'completed' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <DatePicker
  value={editForm.completedAt}
  onChange={(date) => setEditForm({ ...editForm, completedAt: date })}
  maxDate={new Date()}
  label="Completion Date"
  required
/>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Completion Time
                        </label>
                        <input
                        aria-label="completion time"
                          type="time"
                          value={editForm.completedTime}
                          onChange={(e) => setEditForm({ ...editForm, completedTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                  aria-label="notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingAppointment(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}