import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/core/ui/button';
import { Plus, Trophy, UserPlus } from 'lucide-react';

/**
 * QuickActions component
 * 
 * Displays quick action buttons for common tournament-related tasks
 */
export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-2">
        <Button 
          className="w-full justify-start"
          asChild
        >
          <Link href="/tournaments/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Tournament
          </Link>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start"
          asChild
        >
          <Link href="/tournaments">
            <Trophy className="mr-2 h-4 w-4" />
            Browse Tournaments
          </Link>
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-gray-700"
          asChild
        >
          <Link href="/tournaments?filter=invited">
            <UserPlus className="mr-2 h-4 w-4" />
            View Invitations
          </Link>
        </Button>
      </div>
    </div>
  );
} 