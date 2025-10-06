'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

interface DonorProfileFormProps {
    userId: Id<"users">;
    onComplete: () => void;
}

export default function DonorProfileForm({ userId, onComplete }: DonorProfileFormProps) {
    const [formData, setFormData] = useState({
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        dateOfBirth: '',
        bloodGroup: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateProfile = useMutation(api.donors.updateDonorProfile);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await updateProfile({
                userId,
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                dateOfBirth: formData.dateOfBirth,
                bloodGroup: formData.bloodGroup as any,
            });
            onComplete();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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

                    {/* Blood Group */}
                    <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group *</Label>
                        <Select
                            value={formData.bloodGroup}
                            onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select your blood group" />
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

                    {/* Date of Birth */}
                    <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth *</Label>
                        <Input
                            id="dob"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            max={new Date().toISOString().split('T')[0]}
                            required
                        />
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