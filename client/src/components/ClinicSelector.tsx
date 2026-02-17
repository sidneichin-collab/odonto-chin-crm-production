// @ts-nocheck
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Globe } from "lucide-react";
import { COUNTRIES, CLINICS, getClinicsByCountry, getCountryByCode } from "@shared/clinics";

interface ClinicSelectorProps {
  value?: string;
  onChange: (clinicId: string | null) => void;
}

export function ClinicSelector({ value, onChange }: ClinicSelectorProps) {
  const [selectedClinic, setSelectedClinic] = useState<string | undefined>(value);

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("selectedClinic");
    if (saved && saved !== "all") {
      setSelectedClinic(saved);
      onChange(saved);
    }
  }, []);

  const handleChange = (newValue: string) => {
    if (newValue === "all") {
      setSelectedClinic(undefined);
      localStorage.removeItem("selectedClinic");
      onChange(null);
    } else {
      setSelectedClinic(newValue);
      localStorage.setItem("selectedClinic", newValue);
      onChange(newValue);
    }
  };

  const selectedClinicData = selectedClinic 
    ? CLINICS.find(c => c.id === selectedClinic)
    : null;

  return (
    <Select value={selectedClinic || "all"} onValueChange={handleChange}>
      <SelectTrigger className="w-[280px]">
        <div className="flex items-center gap-2">
          {selectedClinicData ? (
            <>
              <Building2 className="w-4 h-4" />
              <span className="truncate">{selectedClinicData.name}</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <SelectValue placeholder="Todas las Clínicas" />
            </>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Todas las Clínicas (70)</span>
          </div>
        </SelectItem>
        
        {COUNTRIES.map((country) => {
          const clinics = getClinicsByCountry(country.code);
          if (clinics.length === 0) return null;
          
          return (
            <SelectGroup key={country.code}>
              <SelectLabel className="flex items-center gap-2 text-sm font-semibold">
                <span>{country.flag}</span>
                <span>{country.name} ({clinics.length})</span>
              </SelectLabel>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  <div className="flex items-center gap-2 pl-4">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">{clinic.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
