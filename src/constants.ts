/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material } from './types';

export const DEFAULT_MATERIALS: Material[] = [
  { id: 'banner', name: 'بانر (Banner)', pricePerSqm: 25 },
  { id: 'flex', name: 'فليكس (Flex)', pricePerSqm: 35 },
  { id: 'vinyl', name: 'فينيل (Vinyl)', pricePerSqm: 45 },
  { id: 'sticker', name: 'ستيكر (Sticker)', pricePerSqm: 40 },
  { id: 'mesh', name: 'مش (Mesh)', pricePerSqm: 30 },
  { id: 'custom', name: 'مخصص', pricePerSqm: 0 }
];
