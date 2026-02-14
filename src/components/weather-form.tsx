'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface WeatherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { startTime: string; averageSpeedKmh: number }) => void;
  isLoading: boolean;
}

function getDefaultStartTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  // Format as datetime-local value: YYYY-MM-DDTHH:mm
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T08:00`;
}

export default function WeatherForm({ open, onOpenChange, onSubmit, isLoading }: WeatherFormProps) {
  const [startTime, setStartTime] = useState(getDefaultStartTime);
  const [speed, setSpeed] = useState(25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert datetime-local to ISO 8601
    const isoTime = new Date(startTime).toISOString();
    onSubmit({ startTime: isoTime, averageSpeedKmh: speed });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weather Forecast</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weather-start-time">Start Date & Time</Label>
            <Input
              id="weather-start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weather-speed">Average Speed (km/h)</Label>
            <Input
              id="weather-speed"
              type="number"
              min={5}
              max={60}
              step={1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                'Get Weather'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
