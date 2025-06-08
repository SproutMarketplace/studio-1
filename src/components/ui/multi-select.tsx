
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

interface MultiSelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
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
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-auto min-h-[38px] text-sm", className)}
            {...props}
          >
            <div className="flex flex-wrap gap-1">
              {/* Added explicit check for internalValue before accessing .length */}
              {internalValue && internalValue.length === 0 && (
                <span className="text-muted-foreground font-normal">{placeholder}</span>
              )}
              {/* Added explicit check for internalValue before calling .map */}
              {internalValue && internalValue.map((item) => {
                const option = options.find((opt) => opt.value === item);
                return (
                  <Badge key={item} variant="secondary" className="flex items-center gap-1 font-normal">
                    {option?.label || item}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                  value={option.value}
                  onSelect={(currentValue) => {
                    handleSelect(currentValue);
                  }}
                  className="text-sm"
                >
                  {option.label}
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
