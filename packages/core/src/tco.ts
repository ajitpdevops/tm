import { monthlyRunningCostExact } from "./translator";
import { missing, ok, type Assumptions, type CarSpec, type OwnershipInputs, type Result } from "./types";

export interface Tco {
  onRoadInr: number;
  fuelInr: number;
  insuranceInr: number;
  serviceInr: number;
  resaleInr: number;
  netInr: number;
  totalKm: number;
  perKmInr: number;
  resaleCurve: { year: number; valueInr: number }[];
}

/** Ownership cost over `a.years`. All money in whole ₹; rounding happens once at the end. */
export function computeTco(car: CarSpec, a: Assumptions, own: OwnershipInputs): Result<Tco> {
  if (own.resalePct < 0 || own.resalePct > 1) throw new RangeError(`Invalid resale %: ${own.resalePct}`);
  const monthly = monthlyRunningCostExact(car, a);
  const gaps = [...(car.exShowroomInr == null ? ["exShowroomInr"] : []), ...(monthly.ok ? [] : monthly.missing)];
  if (gaps.length || car.exShowroomInr == null || !monthly.ok) return missing(...gaps);

  const months = a.years * 12;
  const onRoad = car.exShowroomInr * (car.fuel === "electric" ? a.onRoadMultiplierEv : a.onRoadMultiplierIce);
  const fuel = monthly.value * months;
  const insurance = onRoad * a.insurancePctOfOnRoad;
  const service = own.servicePerYearInr * a.years;
  const resale = onRoad * own.resalePct;
  const net = onRoad + fuel + insurance + service - resale;
  const totalKm = a.kmPerMonth * months;

  // Geometric depreciation from on-road to resale value.
  const resaleCurve = Array.from({ length: a.years + 1 }, (_, year) => ({
    year,
    valueInr: Math.round(onRoad * Math.pow(own.resalePct, year / a.years)),
  }));

  return ok({
    onRoadInr: Math.round(onRoad),
    fuelInr: Math.round(fuel),
    insuranceInr: Math.round(insurance),
    serviceInr: Math.round(service),
    resaleInr: Math.round(resale),
    netInr: Math.round(net),
    totalKm,
    perKmInr: Math.round((net / totalKm) * 100) / 100,
    resaleCurve,
  });
}
