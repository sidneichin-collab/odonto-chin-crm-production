export interface Clinic {
  id: string;
  name: string;
  country: string;
  city: string;
}

export const COUNTRIES = [
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
];

export const CLINICS: Clinic[] = [
  // Bolivia (30 clínicas)
  { id: "BO-001", name: "Odonto Chin Santa Cruz Centro", country: "BO", city: "Santa Cruz" },
  { id: "BO-002", name: "Odonto Chin Santa Cruz Norte", country: "BO", city: "Santa Cruz" },
  { id: "BO-003", name: "Odonto Chin Santa Cruz Sur", country: "BO", city: "Santa Cruz" },
  { id: "BO-004", name: "Odonto Chin La Paz Centro", country: "BO", city: "La Paz" },
  { id: "BO-005", name: "Odonto Chin La Paz Zona Sur", country: "BO", city: "La Paz" },
  { id: "BO-006", name: "Odonto Chin Cochabamba", country: "BO", city: "Cochabamba" },
  { id: "BO-007", name: "Odonto Chin Sucre", country: "BO", city: "Sucre" },
  { id: "BO-008", name: "Odonto Chin Tarija", country: "BO", city: "Tarija" },
  { id: "BO-009", name: "Odonto Chin Oruro", country: "BO", city: "Oruro" },
  { id: "BO-010", name: "Odonto Chin Potosí", country: "BO", city: "Potosí" },
  { id: "BO-011", name: "Odonto Chin Trinidad", country: "BO", city: "Trinidad" },
  { id: "BO-012", name: "Odonto Chin Cobija", country: "BO", city: "Cobija" },
  { id: "BO-013", name: "Odonto Chin Montero", country: "BO", city: "Montero" },
  { id: "BO-014", name: "Odonto Chin Warnes", country: "BO", city: "Warnes" },
  { id: "BO-015", name: "Odonto Chin El Alto", country: "BO", city: "El Alto" },
  { id: "BO-016", name: "Odonto Chin Quillacollo", country: "BO", city: "Quillacollo" },
  { id: "BO-017", name: "Odonto Chin Sacaba", country: "BO", city: "Sacaba" },
  { id: "BO-018", name: "Odonto Chin Yacuiba", country: "BO", city: "Yacuiba" },
  { id: "BO-019", name: "Odonto Chin Riberalta", country: "BO", city: "Riberalta" },
  { id: "BO-020", name: "Odonto Chin Guayaramerín", country: "BO", city: "Guayaramerín" },
  { id: "BO-021", name: "Odonto Chin Camiri", country: "BO", city: "Camiri" },
  { id: "BO-022", name: "Odonto Chin Villamontes", country: "BO", city: "Villamontes" },
  { id: "BO-023", name: "Odonto Chin Bermejo", country: "BO", city: "Bermejo" },
  { id: "BO-024", name: "Odonto Chin Tupiza", country: "BO", city: "Tupiza" },
  { id: "BO-025", name: "Odonto Chin Uyuni", country: "BO", city: "Uyuni" },
  { id: "BO-026", name: "Odonto Chin Llallagua", country: "BO", city: "Llallagua" },
  { id: "BO-027", name: "Odonto Chin Villazón", country: "BO", city: "Villazón" },
  { id: "BO-028", name: "Odonto Chin San Ignacio", country: "BO", city: "San Ignacio" },
  { id: "BO-029", name: "Odonto Chin Puerto Suárez", country: "BO", city: "Puerto Suárez" },
  { id: "BO-030", name: "Odonto Chin Santa Cruz Este", country: "BO", city: "Santa Cruz" },

  // Paraguay (20 clínicas)
  { id: "PY-001", name: "Odonto Chin Asunción Centro", country: "PY", city: "Asunción" },
  { id: "PY-002", name: "Odonto Chin Asunción Villa Morra", country: "PY", city: "Asunción" },
  { id: "PY-003", name: "Odonto Chin Asunción Carmelitas", country: "PY", city: "Asunción" },
  { id: "PY-004", name: "Odonto Chin Ciudad del Este", country: "PY", city: "Ciudad del Este" },
  { id: "PY-005", name: "Odonto Chin Encarnación", country: "PY", city: "Encarnación" },
  { id: "PY-006", name: "Odonto Chin Luque", country: "PY", city: "Luque" },
  { id: "PY-007", name: "Odonto Chin San Lorenzo", country: "PY", city: "San Lorenzo" },
  { id: "PY-008", name: "Odonto Chin Lambaré", country: "PY", city: "Lambaré" },
  { id: "PY-009", name: "Odonto Chin Fernando de la Mora", country: "PY", city: "Fernando de la Mora" },
  { id: "PY-010", name: "Odonto Chin Capiatá", country: "PY", city: "Capiatá" },
  { id: "PY-011", name: "Odonto Chin Itauguá", country: "PY", city: "Itauguá" },
  { id: "PY-012", name: "Odonto Chin Mariano Roque Alonso", country: "PY", city: "Mariano Roque Alonso" },
  { id: "PY-013", name: "Odonto Chin Ñemby", country: "PY", city: "Ñemby" },
  { id: "PY-014", name: "Odonto Chin Pedro Juan Caballero", country: "PY", city: "Pedro Juan Caballero" },
  { id: "PY-015", name: "Odonto Chin Coronel Oviedo", country: "PY", city: "Coronel Oviedo" },
  { id: "PY-016", name: "Odonto Chin Villarrica", country: "PY", city: "Villarrica" },
  { id: "PY-017", name: "Odonto Chin Concepción", country: "PY", city: "Concepción" },
  { id: "PY-018", name: "Odonto Chin Caaguazú", country: "PY", city: "Caaguazú" },
  { id: "PY-019", name: "Odonto Chin Pilar", country: "PY", city: "Pilar" },
  { id: "PY-020", name: "Odonto Chin Itá", country: "PY", city: "Itá" },

  // Panamá (5 clínicas)
  { id: "PA-001", name: "Odonto Chin Ciudad de Panamá Centro", country: "PA", city: "Ciudad de Panamá" },
  { id: "PA-002", name: "Odonto Chin Ciudad de Panamá Bella Vista", country: "PA", city: "Ciudad de Panamá" },
  { id: "PA-003", name: "Odonto Chin Colón", country: "PA", city: "Colón" },
  { id: "PA-004", name: "Odonto Chin David", country: "PA", city: "David" },
  { id: "PA-005", name: "Odonto Chin Santiago", country: "PA", city: "Santiago" },

  // Chile (5 clínicas)
  { id: "CL-001", name: "Odonto Chin Santiago Centro", country: "CL", city: "Santiago" },
  { id: "CL-002", name: "Odonto Chin Valparaíso", country: "CL", city: "Valparaíso" },
  { id: "CL-003", name: "Odonto Chin Concepción", country: "CL", city: "Concepción" },
  { id: "CL-004", name: "Odonto Chin La Serena", country: "CL", city: "La Serena" },
  { id: "CL-005", name: "Odonto Chin Antofagasta", country: "CL", city: "Antofagasta" },

  // Uruguay (3 clínicas)
  { id: "UY-001", name: "Odonto Chin Montevideo Centro", country: "UY", city: "Montevideo" },
  { id: "UY-002", name: "Odonto Chin Punta del Este", country: "UY", city: "Punta del Este" },
  { id: "UY-003", name: "Odonto Chin Salto", country: "UY", city: "Salto" },

  // Colombia (4 clínicas)
  { id: "CO-001", name: "Odonto Chin Bogotá Chapinero", country: "CO", city: "Bogotá" },
  { id: "CO-002", name: "Odonto Chin Medellín Poblado", country: "CO", city: "Medellín" },
  { id: "CO-003", name: "Odonto Chin Cali Norte", country: "CO", city: "Cali" },
  { id: "CO-004", name: "Odonto Chin Barranquilla Centro", country: "CO", city: "Barranquilla" },

  // Perú (3 clínicas)
  { id: "PE-001", name: "Odonto Chin Lima Miraflores", country: "PE", city: "Lima" },
  { id: "PE-002", name: "Odonto Chin Arequipa Centro", country: "PE", city: "Arequipa" },
  { id: "PE-003", name: "Odonto Chin Cusco", country: "PE", city: "Cusco" },
];

export function getClinicsByCountry(countryCode: string): Clinic[] {
  return CLINICS.filter(clinic => clinic.country === countryCode);
}

export function getCountryByCode(code: string) {
  return COUNTRIES.find(c => c.code === code);
}
