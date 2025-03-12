"use client";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type DateTimePickerProps = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
};

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
    }
  };

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    value: string
  ) => {
    if (!value) return;

    const currentDate = value ? new Date(value) : new Date();
    let newDate = new Date(currentDate);

    if (type === "hour") {
      const hour = parseInt(value, 10);
      const isPM = newDate.getHours() >= 12;
      newDate.setHours(isPM ? hour + 12 : hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === "ampm") {
      const hours = newDate.getHours();
      if (value === "AM" && hours >= 12) {
        newDate.setHours(hours - 12);
      } else if (value === "PM" && hours < 12) {
        newDate.setHours(hours + 12);
      }
    }

    onChange(newDate);
  };

  return (
    <div className="relative w-full" ref={pickerRef}>
      <div
        className={
          "bg-secondary backdrop-blur px-4 py-1.5 rounded-xl text-sm md:text-base"
        }
      >
        <Button
          variant="outline"
          className={cn(
            "w-full pl-3 text-left font-normal",
            !value && "text-muted-foreground"
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {value ? (
            format(value, "MM/dd/yyyy hh:mm aa")
          ) : (
            <span>MM/DD/YYYY hh:mm aa</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 mt-2 w-fit bg-popover rounded-lg justify-self-center"
          style={{ maxWidth: "-webkit-fill-available" }}
        >
          <div className="sm:flex overflow-hidden w-min">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              initialFocus
            />
            <div className="flex justify-around sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-14 h-14 border-transparent">
                <div className="flex flex-col p-2 justify-center overflow-x-hidden">
                  {Array.from({ length: 12 }, (_, i) => i + 1)
                    .reverse()
                    .map((hour) => (
                      <Button
                        key={hour}
                        size="icon"
                        variant={
                          value && value.getHours() % 12 === hour % 12
                            ? "default"
                            : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square self-center"
                        onClick={() =>
                          handleTimeChange("hour", hour.toString())
                        }
                      >
                        {hour}
                      </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-14 h-14 border-transparent">
                <div className="flex flex-col p-2 justify-center overflow-x-hidden">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        value && value.getMinutes() === minute
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square self-center"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-14 h-14 border-transparent">
                <div className="flex flex-col p-2 justify-center overflow-x-hidden">
                  {["AM", "PM"].map((ampm) => (
                    <Button
                      key={ampm}
                      size="icon"
                      variant={
                        value &&
                        ((ampm === "AM" && value.getHours() < 12) ||
                          (ampm === "PM" && value.getHours() >= 12))
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square self-center"
                      onClick={() => handleTimeChange("ampm", ampm)}
                    >
                      {ampm}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex items-center justify-center p-10">
                <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                >
                Pick this date ? <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}