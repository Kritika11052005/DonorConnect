'use client';

import { X, Calendar, Clock, MapPin, Droplet, AlertCircle, LogIn, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DayPicker } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { useUser, useAuth, SignInButton } from '@clerk/nextjs';
import { toast } from 'sonner';

interface BloodDonationFormProps {
  onClose: () => void;
}

export default function BloodDonationForm({ onClose }: BloodDonationFormProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const hospitals = useQuery(api.hospitals.getAllVerifiedHospitals);
  const existingAppointment = useQuery(api.bloodDonations.getUpcomingAppointment);
  const lastCompletedDonation = useQuery(api.bloodDonations.getLastCompletedDonation);
  const createBloodDonationSignup = useMutation(api.bloodDonations.createBloodDonationSignup);
  const cancelAppointment = useMutation(api.bloodDonations.cancelAppointment);
  
  const [formData, setFormData] = useState({
    lastDonationDate: undefined as Date | undefined,
    weight: '',
    medicalConditions: '',
    availableDays: [] as string[],
    scheduleAppointment: false,
    preferredHospitalId: '',
    scheduledDate: undefined as Date | undefined,
    scheduledTime: '',
    appointmentNotes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLastDonationCalendar, setShowLastDonationCalendar] = useState(false);
  const [showAppointmentCalendar, setShowAppointmentCalendar] = useState(false);
  const [showExistingAppointmentWarning, setShowExistingAppointmentWarning] = useState(false);
  const [actionChoice, setActionChoice] = useState<'cancel' | 'keep' | null>(null);
  const [manuallyEditLastDonation, setManuallyEditLastDonation] = useState(false);
  const [autoFilledLastDonation, setAutoFilledLastDonation] = useState(false);

  // Auto-fill last donation date from database
  useEffect(() => {
    if (lastCompletedDonation && !manuallyEditLastDonation) {
      // Use completedAt if available, otherwise fall back to scheduledDate
      const dateToUse = lastCompletedDonation.completedAt || lastCompletedDonation.scheduledDate;
      if (dateToUse) {
        const lastDonationDate = new Date(dateToUse);
        setFormData(prev => ({ ...prev, lastDonationDate }));
        setAutoFilledLastDonation(true);
      }
    }
  }, [lastCompletedDonation, manuallyEditLastDonation]);

  // Check if user has existing appointment when form loads
  useEffect(() => {
    if (existingAppointment && formData.scheduleAppointment) {
      setShowExistingAppointmentWarning(true);
    }
  }, [existingAppointment, formData.scheduleAppointment]);

  // Calculate next eligible donation date (90 days after last donation)
  const getNextEligibleDate = () => {
    if (!formData.lastDonationDate) {
      return new Date();
    }
    return addDays(formData.lastDonationDate, 90);
  };

  const nextEligibleDate = getNextEligibleDate();

  const handleCancelExistingAppointment = async () => {
    if (!existingAppointment) return;
    
    try {
      await cancelAppointment({ appointmentId: existingAppointment._id });
      toast.success('Previous appointment cancelled successfully');
      setShowExistingAppointmentWarning(false);
      setActionChoice('cancel');
    } catch (error) {
      toast.error('Failed to cancel previous appointment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn || !user) {
      toast.error('Please sign in to complete blood donation signup');
      return;
    }

    // Check if user wants to schedule but has existing appointment
    if (formData.scheduleAppointment && existingAppointment && actionChoice !== 'cancel') {
      setShowExistingAppointmentWarning(true);
      toast.error('Please handle your existing appointment first');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const weight = parseInt(formData.weight);
      
      if (!weight || isNaN(weight)) {
        toast.error('Please enter a valid weight');
        setIsSubmitting(false);
        return;
      }
      
      if (weight < 45) {
        toast.error('Weight must be at least 45 kg for blood donation');
        setIsSubmitting(false);
        return;
      }

      if (formData.scheduleAppointment) {
        if (!formData.preferredHospitalId) {
          toast.error('Please select a hospital');
          setIsSubmitting(false);
          return;
        }
        if (!formData.scheduledDate) {
          toast.error('Please select an appointment date');
          setIsSubmitting(false);
          return;
        }
        if (!formData.scheduledTime) {
          toast.error('Please select a time slot');
          setIsSubmitting(false);
          return;
        }

        if (formData.lastDonationDate && formData.scheduledDate < nextEligibleDate) {
          toast.error(`You must wait until ${format(nextEligibleDate, 'PPP')} (90 days after last donation)`);
          setIsSubmitting(false);
          return;
        }
      }

      await createBloodDonationSignup({
        lastDonationDate: formData.lastDonationDate?.getTime(),
        weight,
        medicalConditions: formData.medicalConditions || '',
        availableDays: formData.availableDays,
        scheduleAppointment: formData.scheduleAppointment,
        preferredHospitalId: formData.scheduleAppointment ? formData.preferredHospitalId as any : undefined,
        scheduledDate: formData.scheduledDate?.getTime(),
        scheduledTime: formData.scheduledTime || '',
        appointmentNotes: formData.appointmentNotes || '',
      });

      toast.success('Successfully signed up for blood donation!');
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error?.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  if (!isUserLoaded) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Authentication Required</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8 text-rose-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800">Sign in to Continue</h3>
              <p className="text-gray-600">
                You need to be signed in to sign up for blood donation. This helps us keep track of your donation history and appointments.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <SignInButton mode="modal">
                <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white h-12 font-semibold">
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </Button>
              </SignInButton>
              
              <Button variant="outline" onClick={onClose} className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 h-12">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Existing Appointment Warning Modal
  if (showExistingAppointmentWarning && existingAppointment) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Existing Appointment Found</h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <p className="text-sm font-medium text-amber-800 mb-2">
                You already have an upcoming appointment scheduled:
              </p>
              <div className="space-y-1 text-sm text-amber-700">
                <p><strong>Hospital:</strong> {existingAppointment.hospital?.hospitalName}</p>
                <p><strong>Date:</strong> {format(new Date(existingAppointment.scheduledDate), 'PPP')}</p>
                <p><strong>Time:</strong> {existingAppointment.scheduledTime}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-gray-700 font-medium">What would you like to do?</p>
              
              <div className="space-y-2">
                <button
                  onClick={handleCancelExistingAppointment}
                  className="w-full p-4 border-2 border-rose-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-rose-500 flex items-center justify-center mt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${actionChoice === 'cancel' ? 'block' : 'hidden'}`}></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Cancel & Reschedule</p>
                      <p className="text-sm text-gray-600">Cancel the existing appointment and schedule a new one</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setFormData({ ...formData, scheduleAppointment: false });
                    setShowExistingAppointmentWarning(false);
                    setActionChoice('keep');
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center mt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gray-500 ${actionChoice === 'keep' ? 'block' : 'hidden'}`}></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Keep Existing Appointment</p>
                      <p className="text-sm text-gray-600">Update your information without scheduling</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExistingAppointmentWarning(false);
                  setFormData({ ...formData, scheduleAppointment: false });
                }}
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Droplet className="w-6 h-6 text-white fill-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Blood Donation Sign-Up</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-rose-50 px-6 py-3 border-b border-rose-100">
          <p className="text-sm text-gray-700">
            Signed in as <span className="font-semibold text-rose-600">{user.emailAddresses[0]?.emailAddress || user.firstName}</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b-2 border-rose-200 pb-2 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-500" />
                Health Information
              </h3>

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  Last Donation Date
                </Label>

                {/* Auto-filled notification */}
                {autoFilledLastDonation && !manuallyEditLastDonation && (
                  <div className="mb-2 p-3 bg-green-50 border-l-4 border-green-400 rounded flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        Auto-filled from your donation history
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Last donation: {format(formData.lastDonationDate!, 'PPP')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setManuallyEditLastDonation(true)}
                      className="text-xs text-green-700 hover:text-green-900 font-medium underline"
                    >
                      Edit
                    </button>
                  </div>
                )}

                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLastDonationCalendar(!showLastDonationCalendar)}
                    disabled={autoFilledLastDonation && !manuallyEditLastDonation}
                    className="w-full justify-start text-left font-normal border-rose-200 hover:border-rose-500 h-11 disabled:opacity-60"
                  >
                    {formData.lastDonationDate ? (
                      <span className="flex items-center gap-2">
                        {format(formData.lastDonationDate, 'PPP')}
                        {autoFilledLastDonation && !manuallyEditLastDonation && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Auto-filled
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">First-time donor? Leave blank</span>
                    )}
                  </Button>
                  
                  {showLastDonationCalendar && (
                    <div className="absolute z-[90] mt-2 bg-white border-2 border-rose-200 rounded-xl shadow-2xl p-4">
                      <DayPicker
                        mode="single"
                        selected={formData.lastDonationDate}
                        onSelect={(date) => {
                          setFormData({ ...formData, lastDonationDate: date });
                          setShowLastDonationCalendar(false);
                          setManuallyEditLastDonation(true);
                        }}
                        disabled={{ after: today, before: threeMonthsAgo }}
                        modifiersStyles={{
                          selected: {
                            backgroundColor: '#f43f5e',
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
                            setFormData({ ...formData, lastDonationDate: undefined });
                            setShowLastDonationCalendar(false);
                            setManuallyEditLastDonation(true);
                            setAutoFilledLastDonation(false);
                          }}
                          className="flex-1"
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setShowLastDonationCalendar(false)}
                          className="flex-1 bg-rose-500 hover:bg-rose-600"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">Must be at least 3 months since last donation</p>
                {formData.lastDonationDate && (
                  <div className="mt-2 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
                    <p className="text-sm font-medium text-amber-800">
                      Next eligible donation date: <span className="font-bold">{format(nextEligibleDate, 'PPP')}</span>
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      You must wait 90 days between donations
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-gray-700 font-semibold flex items-center gap-2">
                  Weight (kg) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 60"
                  min="45"
                  max="200"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="border-rose-200 focus:border-rose-500 focus:ring-rose-500 h-11"
                  required
                />
                <p className="text-xs text-rose-600 font-medium">Minimum: 45 kg required</p>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-700 font-semibold">Available Days for Donation</Label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        formData.availableDays.includes(day)
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md transform scale-105'
                          : 'bg-rose-50 text-gray-700 hover:bg-rose-100 border-2 border-rose-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical" className="text-gray-700 font-semibold">
                  Medical Conditions (if any)
                </Label>
                <Textarea
                  id="medical"
                  placeholder="Please mention any medical conditions, medications, or recent surgeries..."
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                  rows={3}
                  className="border-rose-200 focus:border-rose-500 focus:ring-rose-500 resize-none"
                />
              </div>
            </div>

            <div className="space-y-4 border-t-2 border-gray-200 pt-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="scheduleAppointment"
                  checked={formData.scheduleAppointment}
                  onCheckedChange={(checked) => {
                    if (checked && existingAppointment) {
                      setShowExistingAppointmentWarning(true);
                    }
                    setFormData({ ...formData, scheduleAppointment: checked as boolean });
                  }}
                  className="border-rose-300 data-[state=checked]:bg-rose-500"
                />
                <Label 
                  htmlFor="scheduleAppointment" 
                  className="text-lg font-bold text-gray-800 cursor-pointer flex items-center gap-2"
                >
                  <Clock className="w-5 h-5 text-rose-500" />
                  Schedule an Appointment (Optional)
                </Label>
              </div>

              {formData.scheduleAppointment && (
                <div className="space-y-4 bg-rose-50/50 p-4 rounded-xl border-2 border-rose-100">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      Select Hospital <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={formData.preferredHospitalId}
                      onValueChange={(value) => setFormData({ ...formData, preferredHospitalId: value })}
                    >
                      <SelectTrigger className="border-rose-200 focus:border-rose-500 focus:ring-rose-500 h-11 bg-white">
                        <SelectValue placeholder="Choose a nearby hospital" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[80] max-h-60">
                        {hospitals?.map((hospital) => (
                          <SelectItem key={hospital._id} value={hospital._id}>
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{hospital.hospitalName}</span>
                              <span className="text-xs text-gray-500">
                                {hospital.city}, {hospital.state} • {hospital.hospitalType}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      Appointment Date <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAppointmentCalendar(!showAppointmentCalendar)}
                        className="w-full justify-start text-left font-normal border-rose-200 hover:border-rose-500 h-11 bg-white"
                      >
                        {formData.scheduledDate ? (
                          format(formData.scheduledDate, 'PPP')
                        ) : (
                          <span className="text-gray-500">Pick a date</span>
                        )}
                      </Button>
                      
                      {showAppointmentCalendar && (
                        <div className="absolute z-[90] mt-2 bg-white border-2 border-rose-200 rounded-xl shadow-2xl p-4">
                          <DayPicker
                            mode="single"
                            selected={formData.scheduledDate}
                            onSelect={(date) => {
                              setFormData({ ...formData, scheduledDate: date });
                              setShowAppointmentCalendar(false);
                            }}
                            disabled={{ before: nextEligibleDate }}
                            modifiersStyles={{
                              selected: {
                                backgroundColor: '#f43f5e',
                                color: 'white',
                              },
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowAppointmentCalendar(false)}
                            className="w-full mt-2 bg-rose-500 hover:bg-rose-600"
                          >
                            Confirm Date
                          </Button>
                        </div>
                      )}
                    </div>
                    {formData.lastDonationDate && (
                      <p className="text-xs text-amber-600 font-medium">
                        Appointments available from {format(nextEligibleDate, 'PPP')} onwards
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-500" />
                      Preferred Time <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={formData.scheduledTime}
                      onValueChange={(value) => setFormData({ ...formData, scheduledTime: value })}
                    >
                      <SelectTrigger className="border-rose-200 focus:border-rose-500 focus:ring-rose-500 h-11 bg-white">
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white z-[80]">
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentNotes" className="text-gray-700 font-semibold">
                      Additional Notes (Optional)
                    </Label>
                    <Textarea
                      id="appointmentNotes"
                      placeholder="Any specific requirements or preferences..."
                      value={formData.appointmentNotes}
                      onChange={(e) => setFormData({ ...formData, appointmentNotes: e.target.value })}
                      rows={2}
                      className="border-rose-200 focus:border-rose-500 focus:ring-rose-500 resize-none bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-2 border-rose-300 text-rose-600 hover:bg-rose-50 h-12 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg h-12 font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Complete Sign-Up'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}