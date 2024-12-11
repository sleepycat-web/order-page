export interface Promo {
  code: string;
  percentage: number;
}

export async function getPromos(): Promise<Promo[]> {
  try {
    const response = await fetch("/api/getPromo");
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch promos: ${errorData.error}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error in getPromos:", error);
    throw error;
  }
}

export async function validatePromo(code: string): Promise<Promo | null> {
  const promos = await getPromos();
  return (
    promos.find((promo) => promo.code.toLowerCase() === code.toLowerCase()) ||
    null
  );
}

export function validatePromoSync(code: string, promos: Promo[]): Promo | null {
  return (
    promos.find((promo) => promo.code.toLowerCase() === code.toLowerCase()) ||
    null
  );
}
