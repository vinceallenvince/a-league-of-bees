import React, { useState } from 'react';
import { ScoreFormData } from '../../types';
import { ScreenshotUploader } from './ScreenshotUploader';

interface ScoreSubmissionProps {
  onSubmit: (data: ScoreFormData) => void;
  currentDay: number;
  totalDays: number;
  requiresVerification: boolean;
  isLoading?: boolean;
}

/**
 * ScoreSubmission component for submitting daily scores
 */
export function ScoreSubmission({
  onSubmit,
  currentDay,
  totalDays,
  requiresVerification,
  isLoading = false
}: ScoreSubmissionProps) {
  const [formData, setFormData] = useState<ScoreFormData>({
    day: currentDay,
    score: 0,
    screenshot: undefined
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Generate array of days from 1 to totalDays
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'day') {
      setFormData({
        ...formData,
        day: parseInt(value, 10)
      });
    } else if (name === 'score') {
      setFormData({
        ...formData,
        score: parseInt(value, 10)
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
  
  const handleScreenshotChange = (file: File | null) => {
    setFormData({
      ...formData,
      screenshot: file || undefined
    });
    
    // Clear error when screenshot is changed
    if (errors.screenshot) {
      setErrors({
        ...errors,
        screenshot: ''
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.score <= 0) {
      newErrors.score = 'Score is required and must be greater than 0';
    }
    
    if (requiresVerification && !formData.screenshot) {
      newErrors.screenshot = 'Screenshot is required for verification';
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
        <label htmlFor="day" className="block text-sm font-medium">
          Day
        </label>
        <select
          id="day"
          name="day"
          value={formData.day}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        >
          {days.map((day) => (
            <option key={day} value={day} disabled={day > currentDay}>
              Day {day} {day > currentDay ? '(Coming soon)' : ''}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="score" className="block text-sm font-medium">
          Score
        </label>
        <input
          type="number"
          id="score"
          name="score"
          min="1"
          value={formData.score || ''}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            errors.score ? 'border-red-500' : ''
          }`}
          disabled={isLoading}
        />
        {errors.score && <p className="mt-1 text-sm text-red-600">{errors.score}</p>}
      </div>
      
      <div>
        <label htmlFor="screenshot" className="block text-sm font-medium mb-1">
          Screenshot {requiresVerification ? '(Required)' : '(Optional)'}
        </label>
        <ScreenshotUploader
          onChange={handleScreenshotChange}
          error={errors.screenshot}
          required={requiresVerification}
          disabled={isLoading}
        />
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
              Submitting...
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </form>
  );
} 