'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ChevronDown } from "lucide-react";
import 'react-day-picker/dist/style.css';

interface DonorProfileFormProps {
  userId: Id<"users">;
  onComplete: () => void;
  onError?: (error?: string) => void;
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

export default function DonorProfileForm({ userId, onComplete }: DonorProfileFormProps) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!formData.dateOfBirth) {
                alert('Please select your date of birth');
                setIsSubmitting(false);
                return;
            }

            await updateProfile({
                userId,
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                dateOfBirth: format(formData.dateOfBirth, 'yyyy-MM-dd'),
                bloodGroup: formData.bloodGroup as any,
                gender: formData.gender as any,
            });
            onComplete();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
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
                    <h2 className="text-2xl font-bold">Complete Your Profile</h2>
                    <p className="text-rose-100 mt-1">We need a few more details to get you started</p>
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
                            required
                        />
                    </div>

                    {/* Blood Group and Gender in a row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bloodGroup">Blood Group *</Label>
                            <Select
                                value={formData.bloodGroup}
                                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                                required
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
                                required
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
    {/* ✅ Custom Month/Year controls */}
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

    {/* ✅ DayPicker without native dropdowns */}
    <DayPicker
      mode="single"
      month={formData.dateOfBirth || new Date()}
      onMonthChange={() => {}} // no-op since handled by custom dropdowns
      selected={formData.dateOfBirth}
      onSelect={(date) => {
        setFormData({ ...formData, dateOfBirth: date });
        setShowDatePicker(false);
      }}
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
                            required
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
                                required
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
                                required
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
                            required
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
                                Saving...
                            </>
                        ) : (
                            'Complete Profile'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}