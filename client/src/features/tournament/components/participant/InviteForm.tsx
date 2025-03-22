import React, { useState } from 'react';
import { Button } from '@/core/ui/button';
import { Input } from '@/core/ui/input';
import { Label } from '@/core/ui/label';
import { Textarea } from '@/core/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/core/ui/alert';

interface InviteFormProps {
  tournamentId: string;
  onInvite: (emails: string[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * InviteForm component for inviting users to tournaments
 */
export function InviteForm({
  onInvite,
  onCancel,
  isLoading = false
}: InviteFormProps) {
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [singleEmail, setSingleEmail] = useState('');
  
  // Regular expression for email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmailInput(e.target.value);
    setError(null);
  };
  
  const handleSingleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSingleEmail(e.target.value);
    setError(null);
  };
  
  const handleAddSingleEmail = () => {
    if (!singleEmail.trim()) return;
    
    if (!emailRegex.test(singleEmail)) {
      setError(`Invalid email format: ${singleEmail}`);
      return;
    }
    
    if (emailList.includes(singleEmail)) {
      setError(`Email already added: ${singleEmail}`);
      return;
    }
    
    setEmailList(prev => [...prev, singleEmail]);
    setSingleEmail('');
    setError(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSingleEmail();
    }
  };
  
  const handleProcessBulkEmails = () => {
    if (!emailInput.trim()) return;
    
    const emails = emailInput
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email !== '');
    
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      setError(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }
    
    // Filter out duplicates and add to email list
    const newEmails = emails.filter(email => !emailList.includes(email));
    setEmailList(prev => [...prev, ...newEmails]);
    setEmailInput('');
    setError(null);
  };
  
  const handleRemoveEmail = (email: string) => {
    setEmailList(prev => prev.filter(e => e !== email));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emailList.length === 0) {
      setError('Please add at least one email address');
      return;
    }
    
    try {
      await onInvite(emailList);
    } catch (error) {
      setError('Failed to send invitations. Please try again.');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="singleEmail" className="mb-1 block">Invite by Email</Label>
        <div className="flex">
          <Input
            id="singleEmail"
            type="email"
            placeholder="Enter email address"
            value={singleEmail}
            onChange={handleSingleEmailChange}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-r-none"
            disabled={isLoading}
          />
          <Button 
            type="button" 
            onClick={handleAddSingleEmail}
            className="rounded-l-none"
            disabled={isLoading}
          >
            Add
          </Button>
        </div>
      </div>
      
      <div>
        <Label htmlFor="bulkEmails" className="mb-1 block">Bulk Add (separated by commas, semicolons, or new lines)</Label>
        <Textarea
          id="bulkEmails"
          placeholder="Enter multiple email addresses..."
          value={emailInput}
          onChange={handleTextareaChange}
          className="h-32"
          disabled={isLoading}
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleProcessBulkEmails}
          className="mt-2"
          disabled={isLoading}
        >
          Process Bulk Emails
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {emailList.length > 0 && (
        <div className="mt-4">
          <Label className="mb-2 block">Email List ({emailList.length})</Label>
          <div className="border rounded-md p-2 max-h-48 overflow-y-auto bg-gray-50">
            <ul className="list-disc pl-5 space-y-1">
              {emailList.map((email, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <span className="text-sm">{email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    className="h-6 w-6 p-0"
                    disabled={isLoading}
                  >
                    ✕
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={emailList.length === 0 || isLoading}
        >
          {isLoading ? 'Sending Invites...' : 'Send Invitations'}
        </Button>
      </div>
    </form>
  );
} 