'use client';

import { Button } from '@/components/ui/button';
import { useUnits } from '@/components/units-provider';

export function UnitsToggle() {
  const { imperial, toggleUnits } = useUnits();

  return (
    <Button variant="outline" size="icon" onClick={toggleUnits} title="Toggle units">
      <span className="text-xs font-semibold">{imperial ? 'mi' : 'km'}</span>
    </Button>
  );
}
