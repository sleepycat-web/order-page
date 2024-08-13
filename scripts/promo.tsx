// scripts/promo.tsx

export interface Promo {
  code: string;
  percentage: number;
}

export const promos: Promo[] = [
  { code: "FIRST", percentage: 10 },
  { code: "WELCOME20", percentage: 20 },
  // Add more promo codes as needed
];

export function validatePromo(code: string): Promo | null {
  return (
    promos.find((promo) => promo.code.toLowerCase() === code.toLowerCase()) ||
    null
  );
}
