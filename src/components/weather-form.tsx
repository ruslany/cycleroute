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
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ChevronDownIcon, Loader2 } from 'lucide-react';
import { useUnits } from '@/components/units-provider';
import { kmhToMph } from '@/lib/units';

interface WeatherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { startTime: string; averageSpeedKmh: number }) => void;
  isLoading: boolean;
}

function getDefaultDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return tomorrow;
}

export default function WeatherForm({ open, onOpenChange, onSubmit, isLoading }: WeatherFormProps) {
  const { imperial } = useUnits();
  const [date, setDate] = useState<Date | undefined>(getDefaultDate);
  const [time, setTime] = useState('08:00');
  const [speed, setSpeed] = useState(imperial ? Math.round(kmhToMph(25)) : 25);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [maxDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    const speedKmh = imperial ? speed * 1.60934 : speed;
    onSubmit({ startTime: combined.toISOString(), averageSpeedKmh: speedKmh });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weather Forecast</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Start Date & Time</Label>
            <FieldGroup className="flex-row">
              <Field>
                <FieldLabel htmlFor="weather-date">Date</FieldLabel>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="weather-date"
                      className="w-full justify-between font-normal"
                    >
                      {date ? format(date, 'PPP') : 'Select date'}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      captionLayout="dropdown"
                      defaultMonth={date}
                      disabled={{ before: new Date(), after: maxDate }}
                      onSelect={(d) => {
                        setDate(d);
                        setCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field className="w-32">
                <FieldLabel htmlFor="weather-time">Time</FieldLabel>
                <Input
                  type="time"
                  id="weather-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </Field>
            </FieldGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weather-speed">Average Speed ({imperial ? 'mph' : 'km/h'})</Label>
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
            <Button type="submit" disabled={isLoading || !date}>
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
