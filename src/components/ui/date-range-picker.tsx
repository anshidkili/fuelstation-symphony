
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  value?: DateRange | { from: Date; to: Date };
  onChange?: (date: DateRange) => void;
  className?: string;
}

export function DatePickerWithRange({
  value,
  onChange,
  className,
}: DatePickerWithRangeProps) {
  // Ensure value is a DateRange type with from/to properties
  const normalizedValue = value ? {
    from: value.from,
    to: 'to' in value ? value.to : undefined
  } : undefined;

  const handleDateChange = (newDate: DateRange | undefined) => {
    if (onChange && newDate) {
      onChange(newDate);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {normalizedValue?.from ? (
              normalizedValue.to ? (
                <>
                  {format(normalizedValue.from, "LLL dd, y")} -{" "}
                  {format(normalizedValue.to, "LLL dd, y")}
                </>
              ) : (
                format(normalizedValue.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={normalizedValue?.from}
            selected={normalizedValue}
            onSelect={handleDateChange}
            numberOfMonths={2}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
