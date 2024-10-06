export interface Promo {
  code: string;
  percentage: number;
}

export const promos: Promo[] = [
  { code: "4NKUXH", percentage: 10 },
  { code: "KRITS24", percentage: 10 },
  { code: "GOEPIC", percentage: 5 },
  { code: "AYUSHI", percentage: 5 },

  { code: "KABYAROY", percentage: 10 },
  { code: "ABID12345", percentage: 10 },
  { code: "CHAIMINESKS", percentage: 10 },
  { code: "CMDEEP", percentage: 10 },
  { code: "KSHITTIZ", percentage: 10 },
  { code: "ABHISHEKKUSHAWAHA", percentage: 10 },
  { code: "THARABAAP", percentage: 10 },
  { code: "ANISH11", percentage: 10 },
  { code: "PARAB", percentage: 10 },
  { code: "UDAY090", percentage: 10 },
  { code: "ISHAN25", percentage: 10 },
  { code: "TOSCM", percentage: 5 },
  { code: "ABHIJEETDUTTA", percentage: 10 },
  { code: "CMVISHAL", percentage: 10 },
  { code: "CHAILOVERV", percentage: 10 },
  { code: "CMVIVEK", percentage: 10 },
  { code: "CMWILLIAM", percentage: 10 },
  { code: "CMSUBHADWIP", percentage: 10 },
  { code: "CMLOID", percentage: 10 },
  { code: "CMNALENDU", percentage: 10 },
  { code: "CMPARVEZ", percentage: 10 },
  { code: "CMSNEHA", percentage: 10 },
  { code: "SHATRU", percentage: 5 },
  { code: "CMSTAFF", percentage: 50 },
  { code: "CMOWNER", percentage: 100 },
];

export function validatePromo(code: string): Promo | null {
  return (
    promos.find((promo) => promo.code.toLowerCase() === code.toLowerCase()) ||
    null
  );
}
