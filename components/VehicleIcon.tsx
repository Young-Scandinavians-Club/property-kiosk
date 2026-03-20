import type { SvgProps } from 'react-native-svg';

import HatchbackIcon from '@/assets/vehicles/hatchback.svg';
import SedanIcon from '@/assets/vehicles/sedan.svg';
import SuvIcon from '@/assets/vehicles/suv.svg';
import TruckIcon from '@/assets/vehicles/truck.svg';
import VanIcon from '@/assets/vehicles/van.svg';

export type VehicleType = 'Sedan' | 'SUV' | 'Hatchback' | 'Pickup Truck' | 'Van';

interface VehicleIconProps {
  type: VehicleType | string;
  size?: number;
  color?: string;
}

const ICONS: Record<VehicleType, React.ComponentType<SvgProps>> = {
  Sedan: SedanIcon,
  SUV: SuvIcon,
  Hatchback: HatchbackIcon,
  'Pickup Truck': TruckIcon,
  Van: VanIcon,
};

/** Maps API type strings to our VehicleType; defaults to Sedan for unknown. */
function normalizeType(type: string): VehicleType {
  const t = type?.trim() || '';
  if (t in ICONS) return t as VehicleType;
  const lower = t.toLowerCase();
  if (lower.includes('truck') || lower.includes('pickup')) return 'Pickup Truck';
  if (lower.includes('van')) return 'Van';
  if (lower.includes('suv')) return 'SUV';
  if (lower.includes('hatchback')) return 'Hatchback';
  return 'Sedan';
}

export function VehicleIcon({ type, size = 20, color = '#6b7280' }: VehicleIconProps) {
  const Icon = ICONS[normalizeType(type)];
  if (!Icon) return null;
  return <Icon width={size} height={size} color={color} />;
}
