'use client';

import { X, Calendar, Clock, MapPin, Droplet } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface BloodDonationFormProps {
  onClose: () => void;
}

export default function BloodDonationForm({ onClose }: BloodDonationFormProps) {
  const { user } = useUser();
  const hospitals = useQuery(api.hospitals.getAllVerifiedHospitals);
  const createBloodDonationSignup = useMutation(api.bloodDonations.createBloodDonationSignup);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }

      // Submit to database
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Droplet className="w-6 h-6 text-white fill-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Blood Donation Sign-Up</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Health Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b-2 border-rose-200 pb-2 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-500" />
                Health Information
              </h3>

              {/* Last Donation Date with Calendar */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  Last Donation Date
                </Label>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLastDonationCalendar(!showLastDonationCalendar)}
                    className="w-full justify-start text-left font-normal border-rose-200 hover:border-rose-500 h-11"
                  >
                    {formData.lastDonationDate ? (
                      format(formData.lastDonationDate, 'PPP')
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
              </div>

              {/* Weight */}
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

              {/* Available Days */}
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

              {/* Medical Conditions */}
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

            {/* Appointment Scheduling */}
            <div className="space-y-4 border-t-2 border-gray-200 pt-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="scheduleAppointment"
                  checked={formData.scheduleAppointment}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, scheduleAppointment: checked as boolean })
                  }
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
                  {/* Hospital Selection */}
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

                  {/* Appointment Date with Calendar */}
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
                            disabled={{ before: today }}
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
                  </div>

                  {/* Time Slot */}
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

                  {/* Appointment Notes */}
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
        </form>

        {/* Fixed Footer */}
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
              type="submit"
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