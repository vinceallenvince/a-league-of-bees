import React, { useState } from 'react';
import { TournamentFormData } from '../../types';

interface TournamentFormProps {
  initialData: TournamentFormData;
  onSubmit: (data: TournamentFormData) => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

/**
 * Form for creating and editing tournaments - Mock for testing
 */
export function TournamentForm({
  initialData,
  onSubmit,
  isEditing = false,
  isLoading = false
}: TournamentFormProps) {
  const [formData, setFormData] = useState<TournamentFormData>(initialData);
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
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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
          className="mt-1 block w-full"
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
          className="mt-1 block w-full"
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
          className="mt-1 block w-full"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          className="mt-1 block w-full"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="requiresVerification"
          name="requiresVerification"
          checked={formData.requiresVerification}
          onChange={handleChange}
          className="h-4 w-4"
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
          className="mt-1 block w-full"
          disabled={isLoading}
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time (ET)</option>
        </select>
      </div>
      
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="inline-flex justify-center"
          disabled={isLoading}
        >
          {isEditing ? 'Update' : 'Submit'}
        </button>
      </div>
    </form>
  );
} 