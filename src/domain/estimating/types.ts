export type ResourceCategory = 'material' | 'labor' | 'equipment' | 'subcontract' | 'miscellaneous';

export interface BoqSection {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  sortOrder: number;
}

export interface ResourceComponent {
  id: string;
  category: ResourceCategory;
  description: string;
  quantityPerUnit: number;
  unit: string;
  unitCost: number;
  wastePercent: number;
}

export interface ActivityCostAllocation {
  activityId: string;
  percent: number;
}

export interface BoqItem {
  id: string;
  sectionId: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  manualUnitRate?: number;
  resources: ResourceComponent[];
  allocations: ActivityCostAllocation[];
  notes?: string;
}

export interface MarkupRule {
  id: string;
  name: string;
  ratePercent: number;
  order: number;
  basis: 'direct-cost' | 'running-subtotal';
}

export interface BoqRevision {
  id: string;
  name: string;
  createdAt: string;
  projectRevision: number;
  items: BoqItem[];
  markups: MarkupRule[];
}

export interface BoqModel {
  sections: BoqSection[];
  items: BoqItem[];
  markups: MarkupRule[];
  revisions: BoqRevision[];
}
