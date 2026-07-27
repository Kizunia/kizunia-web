"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;

  value: string | null | undefined;

  placeholder?: string;

  options: readonly Option[];

  onValueChange(value: string): void;
}

export function SelectField({
  label,
  value,
  placeholder,
  options,
  onValueChange,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">

      <label className="text-sm font-medium">
        {label}
      </label>

      <Select
        value={value ?? ""}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              placeholder ?? `Select ${label}`
            }
          />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

    </div>
  );
}