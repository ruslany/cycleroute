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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { POI_CATEGORIES, type PoiCategory } from '@/lib/validations/poi';
import { POI_CATEGORY_CONFIG } from '@/lib/poi-categories';

interface PoiFormValues {
  name: string;
  category: PoiCategory;
  description: string;
}

interface PoiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PoiFormValues) => void;
  initialValues?: Partial<PoiFormValues>;
  title: string;
}

export default function PoiForm({ open, onOpenChange, onSubmit, initialValues, title }: PoiFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [category, setCategory] = useState<PoiCategory>(initialValues?.category ?? 'OTHER');
  const [description, setDescription] = useState(initialValues?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), category, description: description.trim() || '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poi-name">Name</Label>
            <Input
              id="poi-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Point of interest name"
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poi-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as PoiCategory)}>
              <SelectTrigger id="poi-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POI_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {POI_CATEGORY_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="poi-description">Description (optional)</Label>
            <Textarea
              id="poi-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
