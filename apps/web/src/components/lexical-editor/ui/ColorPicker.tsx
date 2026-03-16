'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PRESET_COLORS = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#B7B7B7',
  '#CCCCCC',
  '#D9D9D9',
  '#FFFFFF',
  '#980000',
  '#FF0000',
  '#FF9900',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#4A86E8',
  '#0000FF',
  '#9900FF',
  '#FF00FF',
  '#E6B8AF',
  '#F4CCCC',
  '#FCE5CD',
  '#FFF2CC',
  '#D9EAD3',
  '#D0E0E3',
  '#C9DAF8',
  '#CFE2F3',
  '#D9D2E9',
  '#EAD1DC',
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClear?: () => void;
  children: React.ReactNode;
}

export default function ColorPicker({
  color,
  onChange,
  onClear,
  children,
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color || '');
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[240px] p-3" align="start">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-10 gap-0.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-5 h-5 rounded-sm border transition-transform hover:scale-110 ${
                  color === c
                    ? 'ring-2 ring-primary ring-offset-1'
                    : 'border-border'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <div className="flex gap-1.5 items-center">
            <Input
              className="h-7 text-xs font-mono"
              placeholder="#000000"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customColor.trim()) {
                  onChange(customColor.trim());
                  setOpen(false);
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => {
                if (customColor.trim()) {
                  onChange(customColor.trim());
                  setOpen(false);
                }
              }}
            >
              Apply
            </Button>
          </div>
          {onClear && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Clear color
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
