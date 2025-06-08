
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

// Allow standard button props like onBlur, but override onChange and value
interface MultiSelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  options: Option[];
  value: string[]; // This will be field.value from react-hook-form
  onChange: (value: string[]) => void; // This will be field.onChange
  placeholder?: string;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ options, value: propValue, onChange, placeholder = "Select options...", className, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);

    // Ensure 'internalValue' is always an array for safe operations
    const internalValue = Array.isArray(propValue) ? propValue : [];

    const handleSelect = (currentValue: string) => {
      const isSelected = internalValue.includes(currentValue);
      const newValue = isSelected
        ? internalValue.filter((v) => v !== currentValue)
        : [...internalValue, currentValue];
      onChange(newValue);
    };

    const handleRemove = (itemToRemove: string) => {
      const newValue = internalValue.filter((v) => v !== itemToRemove);
      onChange(newValue);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref} // Apply the forwarded ref here
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-auto min-h-[38px] text-sm", className)}
            {...props} // Spread other props like onBlur from react-hook-form's field
          >
            <div className="flex flex-wrap gap-1">
              {internalValue.length === 0 && (
                <span className="text-muted-foreground font-normal">{placeholder}</span>
              )}
              {internalValue.map((item) => {
                const option = options.find((opt) => opt.value === item);
                return (
                  <Badge key={item} variant="secondary" className="flex items-center gap-1 font-normal">
                    {option?.label || item}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent popover from closing
                        handleRemove(item);
                      }}
                      className="ml-1 outline-none ring-offset-background rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
                  value={option.value} // Used by Command for filtering/value
                  onSelect={(currentValue) => { // currentValue is option.value (the string)
                    handleSelect(currentValue);
                    // For multi-select, typically we don't close the popover on select
                    // setOpen(false); 
                  }}
                  className="text-sm"
                >
                  {option.label}
                  {/* You could add a checkmark here if internalValue.includes(option.value) */}
                </CommandItem>
              ))}
              {options.length === 0 && (
                <CommandItem disabled className="text-sm text-muted-foreground justify-center">No options available</CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
