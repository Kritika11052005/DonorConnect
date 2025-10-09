'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Calendar, X } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { DayPicker } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { ChevronDown } from "lucide-react";
import 'react-day-picker/dist/style.css';

interface DonorProfileFormProps {
  userId: Id<"users">;
  onComplete: () => void;
  onError?: (error?: string) => void;
  isEditMode?: boolean;
  existingData?: {
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    bloodGroup: string;
    gender: string;
    dateOfBirth: string;
  };
}

type FormData = {
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    dateOfBirth: Date | undefined;
    bloodGroup: string;
    gender: string;
};

export default function DonorProfileForm({ userId, onComplete, isEditMode = false, existingData }: DonorProfileFormProps) {
    const [formData, setFormData] = useState<FormData>({
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        dateOfBirth: undefined,
        bloodGroup: '',
        gender: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const updateProfile = useMutation(api.donors.updateDonorProfile);

    // Pre-populate form data in edit mode
    useEffect(() => {
        if (isEditMode && existingData) {
            setFormData({
                phoneNumber: existingData.phoneNumber || '',
                address: existingData.address || '',
                city: existingData.city || '',
                state: existingData.state || '',
                pincode: existingData.pincode || '',
                dateOfBirth: existingData.dateOfBirth 
                    ? parse(existingData.dateOfBirth, 'yyyy-MM-dd', new Date())
                    : undefined,
                bloodGroup: existingData.bloodGroup || '',
                gender: existingData.gender || '',
            });
        }
    }, [isEditMode, existingData]);

    const validateForm = () => {
        if (!formData.phoneNumber.trim()) {
            toast.error('Phone Number Required', {
                description: 'Please enter your phone number',
            });
            return false;
        }

        if (!/^[+]?[0-9\s-]{10,}$/.test(formData.phoneNumber)) {
            toast.error('Invalid Phone Number', {
                description: 'Please enter a valid phone number',
            });
            return false;
        }

        if (!formData.bloodGroup) {
            toast.error('Blood Group Required', {
                description: 'Please select your blood group',
            });
            return false;
        }

        if (!formData.gender) {
            toast.error('Gender Required', {
                description: 'Please select your gender',
            });
            return false;
        }

        if (!formData.dateOfBirth) {
            toast.error('Date of Birth Required', {
                description: 'Please select your date of birth',
            });
            return false;
        }

        if (!formData.address.trim()) {
            toast.error('Address Required', {
                description: 'Please enter your address',
            });
            return false;
        }

        if (!formData.city.trim()) {
            toast.error('City Required', {
                description: 'Please enter your city',
            });
            return false;
        }

        if (!formData.state.trim()) {
            toast.error('State Required', {
                description: 'Please enter your state',
            });
            return false;
        }

        if (!formData.pincode.trim()) {
            toast.error('Pincode Required', {
                description: 'Please enter your pincode',
            });
            return false;
        }

        if (!/^[0-9]{6}$/.test(formData.pincode)) {
            toast.error('Invalid Pincode', {
                description: 'Pincode must be exactly 6 digits',
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await updateProfile({
                userId,
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                dateOfBirth: format(formData.dateOfBirth!, 'yyyy-MM-dd'),
                bloodGroup: formData.bloodGroup as any,
                gender: formData.gender as any,
            });
            
            toast.success(
                isEditMode ? 'Profile Updated!' : 'Profile Completed!',
                {
                    description: isEditMode 
                        ? 'Your profile has been successfully updated.' 
                        : 'Welcome! Your profile is now complete.',
                }
            );
            
            onComplete();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Update Failed', {
                description: 'Failed to update profile. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setFormData({ ...formData, dateOfBirth: date });
            setShowDatePicker(false);
            toast.success('Date Selected', {
                description: `Birth date set to ${format(date, 'PPP')}`,
            });
        }
    };

    // Calculate max date (18 years ago for eligibility)
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 18);
    
    // Minimum date (100 years ago)
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {isEditMode ? 'Edit Your Profile' : 'Complete Your Profile'}
                            </h2>
                            <p className="text-rose-100 mt-1">
                                {isEditMode 
                                    ? 'Update your information below' 
                                    : 'We need a few more details to get you started'}
                            </p>
                        </div>
                        {isEditMode && (
                            <button
                                onClick={onComplete}
                                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />
                    </div>

                    {/* Blood Group and Gender in a row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bloodGroup">Blood Group *</Label>
                            <Select
                                value={formData.bloodGroup}
                                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent className="z-[90]">
                                    <SelectItem value="A+">A+</SelectItem>
                                    <SelectItem value="A-">A-</SelectItem>
                                    <SelectItem value="B+">B+</SelectItem>
                                    <SelectItem value="B-">B-</SelectItem>
                                    <SelectItem value="AB+">AB+</SelectItem>
                                    <SelectItem value="AB-">AB-</SelectItem>
                                    <SelectItem value="O+">O+</SelectItem>
                                    <SelectItem value="O-">O-</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender *</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent className="z-[90]">
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date of Birth with Calendar Picker */}
                    <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-rose-500" />
                            Date of Birth *
                        </Label>

                        <div className="relative">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="w-full justify-start text-left font-normal border-rose-200 hover:border-rose-500 h-11"
                            >
                                {formData.dateOfBirth ? (
                                    format(formData.dateOfBirth, 'PPP')
                                ) : (
                                    <span className="text-gray-500">Select your date of birth</span>
                                )}
                            </Button>

                            {showDatePicker && (
                                <div className="absolute z-[90] mt-2 bg-white border-2 border-rose-200 rounded-xl shadow-2xl p-4">
                                    {/* Custom Month/Year controls */}
                                    <div className="flex gap-2 mb-4">
                                        {/* Month dropdown */}
                                        <div className="relative flex-1">
                                            <select
                                                value={formData.dateOfBirth ? formData.dateOfBirth.getMonth() : new Date().getMonth()}
                                                onChange={(e) => {
                                                    const newDate = new Date(formData.dateOfBirth || new Date());
                                                    newDate.setMonth(Number(e.target.value));
                                                    setFormData({ ...formData, dateOfBirth: newDate });
                                                }}
                                                className="w-full appearance-none border-2 border-rose-200 rounded-lg py-2 pl-3 pr-8 text-gray-800 font-medium cursor-pointer hover:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300"
                                            >
                                                {[
                                                    "January","February","March","April","May","June",
                                                    "July","August","September","October","November","December"
                                                ].map((month, i) => (
                                                    <option key={i} value={i}>{month}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 w-4 h-4 pointer-events-none" />
                                        </div>

                                        {/* Year dropdown */}
                                        <div className="relative flex-1">
                                            <select
                                                value={formData.dateOfBirth ? formData.dateOfBirth.getFullYear() : new Date().getFullYear()}
                                                onChange={(e) => {
                                                    const newDate = new Date(formData.dateOfBirth || new Date());
                                                    newDate.setFullYear(Number(e.target.value));
                                                    setFormData({ ...formData, dateOfBirth: newDate });
                                                }}
                                                className="w-full appearance-none border-2 border-rose-200 rounded-lg py-2 pl-3 pr-8 text-gray-800 font-medium cursor-pointer hover:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300"
                                            >
                                                {Array.from({ length: maxDate.getFullYear() - minDate.getFullYear() + 1 })
                                                    .map((_, i) => maxDate.getFullYear() - i)
                                                    .map((year) => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 w-4 h-4 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* DayPicker */}
                                    <DayPicker
                                        mode="single"
                                        month={formData.dateOfBirth || new Date()}
                                        onMonthChange={() => {}}
                                        selected={formData.dateOfBirth}
                                        onSelect={handleDateSelect}
                                        disabled={{ after: maxDate, before: minDate }}
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
                                        onClick={() => setShowDatePicker(false)}
                                        className="w-full mt-2 bg-rose-500 hover:bg-rose-600"
                                    >
                                        Confirm Date
                                    </Button>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-gray-500">
                            You must be at least 18 years old to donate
                        </p>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                            id="address"
                            type="text"
                            placeholder="House No, Street Name"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    {/* City and State */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Input
                                id="city"
                                type="text"
                                placeholder="e.g., Delhi"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State *</Label>
                            <Input
                                id="state"
                                type="text"
                                placeholder="e.g., Delhi"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Pincode */}
                    <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                            id="pincode"
                            type="text"
                            placeholder="110001"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            pattern="[0-9]{6}"
                            maxLength={6}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 h-12 text-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {isEditMode ? 'Updating...' : 'Saving...'}
                            </>
                        ) : (
                            isEditMode ? 'Update Profile' : 'Complete Profile'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}