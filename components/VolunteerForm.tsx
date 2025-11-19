import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X, Users, Calendar, AlertCircle, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

interface VolunteerFormProps {
  onClose: () => void;
}

export default function VolunteerForm({ onClose }: VolunteerFormProps) {
  const { user } = useUser();
  const [selectedNgo, setSelectedNgo] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showExistingVolunteerWarning, setShowExistingVolunteerWarning] = useState(false);
  const [actionChoice, setActionChoice] = useState<'cancel' | 'keep' | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch verified NGOs
  const ngos = useQuery(api.ngos.getVerifiedNgos);
  
  // Fetch active volunteer registrations
  const activeVolunteer = useQuery(api.volunteers.getActiveVolunteerRegistration);
  
  // Mutation to create volunteer registration
  const createVolunteer = useMutation(api.volunteers.create);
  
  // Mutation to cancel volunteer registration
  const cancelVolunteer = useMutation(api.volunteers.updateStatus);

  // Check for existing registration when NGO is selected
  useEffect(() => {
    if (selectedNgo && activeVolunteer && actionChoice !== 'cancel') {
      setShowExistingVolunteerWarning(true);
    }
  }, [selectedNgo, activeVolunteer, actionChoice]);

  const handleCancelExistingVolunteer = async () => {
    if (!activeVolunteer) return;
    
    try {
      await cancelVolunteer({ 
        volunteerId: activeVolunteer._id,
        status: 'cancelled'
      });
      toast.success('Previous volunteer registration cancelled successfully');
      setShowExistingVolunteerWarning(false);
      setActionChoice('cancel');
    } catch (error) {
      toast.error('Failed to cancel previous registration');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if user has active registration and hasn't cancelled it
    if (activeVolunteer && actionChoice !== 'cancel') {
      setShowExistingVolunteerWarning(true);
      toast.error('Please handle your existing volunteer registration first');
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (!selectedNgo || !startDate) {
        throw new Error('Please fill in all required fields');
      }

      const startTimestamp = startDate.getTime();
      const endTimestamp = startTimestamp + (90 * 24 * 60 * 60 * 1000); // 3 months

      await createVolunteer({
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        ngoId: selectedNgo as any,
        startDate: startTimestamp,
        endDate: endTimestamp,
        role: role || undefined,
        status: 'active',
        hoursContributed: 0,
      });

      setSuccess(true);
      toast.success('Successfully registered as volunteer!');
      setTimeout(() => {
        onClose();
      }, 2000);//eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to register as volunteer');
      toast.error(err.message || 'Failed to register as volunteer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date helper
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Calendar functions
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDateCalendar = startOfWeek(monthStart);
  const endDateCalendar = endOfWeek(monthEnd);
  const dateRange = eachDayOfInterval({ start: startDateCalendar, end: endDateCalendar });
  const minDateObj = new Date();

  const handleDateClick = (date: Date) => {
    if (isBefore(date, minDateObj) && !isSameDay(date, minDateObj)) {
      return;
    }
    setStartDate(date);
    setShowStartDateCalendar(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, minDateObj) && !isSameDay(date, minDateObj);
  };

  // Existing Volunteer Warning Modal
  if (showExistingVolunteerWarning && activeVolunteer) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Active Volunteer Registration Found</h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <p className="text-sm font-medium text-amber-800 mb-2">
                You already have an active volunteer registration:
              </p>
              <div className="space-y-1 text-sm text-amber-700">
                <p><strong>NGO:</strong> {activeVolunteer.ngo?.organizationName}</p>
                <p><strong>Role:</strong> {activeVolunteer.role || 'General Volunteer'}</p>
                <p><strong>Start Date:</strong> {formatDate(activeVolunteer.startDate)}</p>
                <p><strong>End Date:</strong> {formatDate(activeVolunteer.endDate)}</p>
                <p><strong>Hours Contributed:</strong> {activeVolunteer.hoursContributed || 0} hours</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-gray-700 font-medium">What would you like to do?</p>
              
              <div className="space-y-2">
                <button
                  onClick={handleCancelExistingVolunteer}
                  className="w-full p-4 border-2 border-rose-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-rose-500 flex items-center justify-center mt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${actionChoice === 'cancel' ? 'block' : 'hidden'}`}></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Cancel & Register with New NGO</p>
                      <p className="text-sm text-gray-600">Cancel current registration and sign up with a different organization</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowExistingVolunteerWarning(false);
                    setSelectedNgo('');
                    setActionChoice('keep');
                    onClose();
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center mt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gray-500 ${actionChoice === 'keep' ? 'block' : 'hidden'}`}></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Keep Current Registration</p>
                      <p className="text-sm text-gray-600">Continue with your existing volunteer commitment</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowExistingVolunteerWarning(false);
                  setSelectedNgo('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if form should be disabled (has active volunteer and hasn't chosen to cancel)
  const isFormDisabled = !!(activeVolunteer && actionChoice !== 'cancel');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Volunteer Registration</h2>
              <p className="text-sm text-gray-600">Join an NGO and make a difference</p>
            </div>
          </div>
          <button
          aria-label="close modal"
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

          {success && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-sm text-emerald-800">Successfully registered as volunteer!</p>
            </div>
          )}

          {/* Show warning if active volunteer exists */}
          {isFormDisabled && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">You have an active volunteer registration</p>
                <p>You can only have one active registration at a time. Select a new NGO to see your options.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Select NGO <span className="text-red-500">*</span>
            </label>
            <select
            aria-label="select ngo"
              value={selectedNgo}
              onChange={(e) => setSelectedNgo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              required
              disabled={isSubmitting}
            >
              <option value="">Choose an NGO...</option>
              {ngos?.map((ngo) => (
                <option key={ngo._id} value={ngo._id}>
                  {ngo.organizationName}
                </option>
              ))}
            </select>
            {ngos && ngos.length === 0 && (
              <p className="text-xs text-gray-500">No verified NGOs available at the moment</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => !isSubmitting && !isFormDisabled && setShowStartDateCalendar(!showStartDateCalendar)}
                disabled={isSubmitting || isFormDisabled}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-left transition-all flex items-center gap-3 ${
                  isSubmitting || isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
                }`}
              >
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className={startDate ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {startDate ? format(startDate, 'MMMM dd, yyyy') : 'Select a date'}
                </span>
              </button>

              {showStartDateCalendar && !isSubmitting && !isFormDisabled && (
                <div className="absolute z-50 mt-2 bg-white border-2 border-emerald-200 rounded-2xl shadow-2xl p-5 w-full min-w-[340px] animate-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <button
                    aria-label="previous month"
                      type="button"
                      onClick={goToPreviousMonth}
                      className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all group"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                    </button>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <button
                    aria-label="next month"
                      type="button"
                      onClick={goToNextMonth}
                      className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all group"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  </div>

                  {/* Weekday labels */}
                  <div className="grid grid-cols-7 gap-2 mb-3">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-center text-xs font-bold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar dates */}
                  <div className="grid grid-cols-7 gap-2">
                    {dateRange.map((date, idx) => {
                      const isCurrentMonth = isSameMonth(date, currentMonth);
                      const isSelected = startDate && isSameDay(date, startDate);
                      const isDisabled = isDateDisabled(date);
                      const isToday = isSameDay(date, new Date());

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDateClick(date)}
                          disabled={isDisabled}
                          className={`
                            relative h-11 rounded-xl text-sm font-semibold transition-all
                            ${!isCurrentMonth ? 'text-gray-300 hover:text-gray-400' : ''}
                            ${isSelected
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-300'
                              : isDisabled
                              ? 'text-gray-300 cursor-not-allowed'
                              : isCurrentMonth
                              ? 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 hover:scale-105 hover:shadow-md'
                              : ''
                            }
                            ${isToday && !isSelected ? 'ring-2 ring-emerald-400 text-emerald-600 font-bold' : ''}
                          `}
                        >
                          {format(date, 'd')}
                          {isToday && !isSelected && (
                            <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="mt-5 pt-4 border-t border-gray-200 flex justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate(new Date());
                        setShowStartDateCalendar(false);
                      }}
                      className="flex-1 text-sm font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-600 transition-all px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStartDateCalendar(false)}
                      className="flex-1 text-sm font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition-all px-4 py-2.5 rounded-xl"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">Volunteer period is automatically set to 3 months</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Preferred Role (Optional)
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Teaching, Event Coordinator, Field Work"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isSubmitting || isFormDisabled}
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-emerald-900 mb-2">What to expect:</h3>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>• 3-month volunteering commitment</li>
              <li>• Flexible hours based on your availability</li>
              <li>• Certificate upon completion</li>
              <li>• Make a real impact in your community</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !ngos || ngos.length === 0 || isFormDisabled}
            >
              {isSubmitting ? 'Registering...' : 'Register as Volunteer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}