/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Unit = 'm' | 'cm' | 'mm';

export interface CalculationResult {
  id: string;
  length: number;
  width: number;
  unit: Unit;
  area: number;
  pricePerSqm: number;
  printingCost: number;
  installationCost: number;
  totalPrice: number;
  materialName: string;
  timestamp: number;
}

export interface Material {
  id: string;
  name: string;
  pricePerSqm: number;
}
