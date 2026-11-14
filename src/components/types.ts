export type DishTier = 1 | 2 | 3 | 4 | 5;

export interface ConveyorDish {
  id: string;
  name: string;
  description?: string;
  price: string;
  tier?: DishTier;
  image: string;
  details?: string[];
}

export interface SushiConveyorMenuLabels {
  add: string;
  close: string;
  previous: string;
  next: string;
  pause?: string;
}

export interface SushiConveyorMenuProps extends React.HTMLAttributes<HTMLElement> {
  items: ConveyorDish[];
  eyebrow?: string;
  heading?: string;
  caption?: string;
  action?: React.ReactNode;
  speed?: number;
  paused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  autoplay?: boolean;
  interval?: number;
  active?: number | null;
  onActiveChange?: (index: number | null) => void;
  onOpenChange?: (index: number | null) => void;
  onAdd?: (item: ConveyorDish) => void;
  legend?: { [tier: number]: string };
  labels?: SushiConveyorMenuLabels;
}