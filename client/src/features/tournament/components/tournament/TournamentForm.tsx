import React, { useState } from 'react';

// Import types with fallback for testing
let TournamentFormData: any;
try {
  const types = require('../../types');
  TournamentFormData = types.TournamentFormData;
} catch (e) {
  // Fallback for testing
  TournamentFormData = {
    name: '',
    description: '',
    durationDays: 7,
    startDate: new Date(),
    requiresVerification: false,
    timezone: 'UTC'
  };
}

interface TournamentFormProps {
  initialData: typeof TournamentFormData;
  onSubmit: (data: typeof TournamentFormData) => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

/**
 * Form for creating and editing tournaments
 */
export function TournamentForm({
  initialData,
  onSubmit,
  isEditing = false,
  isLoading = false
}: TournamentFormProps) {
  const [formData, setFormData] = useState<typeof TournamentFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else if (name === 'durationDays') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    selectedDate.setHours(0, 0, 0, 0);
    
    setFormData({
      ...formData,
      startDate: selectedDate
    });
    
    // Clear error when field is changed
    if (errors.startDate) {
      setErrors({
        ...errors,
        startDate: ''
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (formData.startDate < today && !isEditing) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }
    
    if (!formData.durationDays || formData.durationDays < 1) {
      newErrors.durationDays = 'Duration must be at least 1 day';
    } else if (formData.durationDays > 90) {
      newErrors.durationDays = 'Duration cannot exceed 90 days';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  // Format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : ''
          }`}
          disabled={isLoading}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label htmlFor="durationDays" className="block text-sm font-medium">
          Duration (days)
        </label>
        <input
          type="number"
          id="durationDays"
          name="durationDays"
          min="1"
          max="90"
          value={formData.durationDays}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            errors.durationDays ? 'border-red-500' : ''
          }`}
          disabled={isLoading}
        />
        {errors.durationDays && (
          <p className="mt-1 text-sm text-red-600">{errors.durationDays}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formatDateForInput(formData.startDate)}
          onChange={handleDateChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            errors.startDate ? 'border-red-500' : ''
          }`}
          disabled={isLoading}
        />
        {errors.startDate && (
          <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
        )}
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="requiresVerification"
          name="requiresVerification"
          checked={formData.requiresVerification}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          disabled={isLoading}
        />
        <label htmlFor="requiresVerification" className="ml-2 block text-sm">
          Requires Verification
        </label>
      </div>
      
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium">
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          value={formData.timezone}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="Europe/Paris">Paris (CET)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
          <option value="Australia/Sydney">Sydney (AEST)</option>
        </select>
      </div>
      
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : isEditing ? (
            'Update'
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </form>
  );
} 