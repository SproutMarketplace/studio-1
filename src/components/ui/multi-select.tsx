
"use client";

import * as React from "react";
import { ChevronsUpDown, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value: propValue, // Renamed to avoid conflict with internal safeValue
  onChange,
  placeholder = "Select options...",
}) => {
  const [open, setOpen] = React.useState(false);
  // Ensure 'value' is always an array for internal operations
  const value = Array.isArray(propValue) ? propValue : [];

  const handleSelect = (currentValue: string) => {
    const isSelected = value.includes(currentValue);
    const newValue = isSelected
      ? value.filter((v) => v !== currentValue)
      : [...value, currentValue];
    onChange(newValue);
  };

  const handleRemove = (itemToRemove: string) => {
    const newValue = value.filter((v) => v !== itemToRemove);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[38px]"
        >
          <div className="flex flex-wrap gap-1">
            {value.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {value.map((item) => {
              const option = options.find((opt) => opt.value === item);
              return (
                <Badge key={item} variant="secondary" className="flex items-center gap-1">
                  {option?.label || item}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent popover from closing if it's configured to do so
                      handleRemove(item);
                    }}
                    className="ml-1 outline-none ring-offset-background rounded-full"
                    aria-label={`Remove ${option?.label || item}`}
                  >
                    <XCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value} // Used by Command for filtering, if CommandInput is present
                onSelect={() => {
                  handleSelect(option.value);
                  // setOpen(false); // Optionally close popover on select, though for multi-select, users might want to keep it open
                }}
              >
                {option.label}
                {/* Consider adding a visual indicator like a checkmark if the option is selected */}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { MultiSelect };
