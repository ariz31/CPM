import { normalizeEngineeringUnit } from '../units/engineeringUnits';
import type { ProjectRecord } from './types';

export function normalizeProjectEngineeringUnits(project: ProjectRecord): ProjectRecord {
  return {
    ...project,
    activities: project.activities.map((activity) => {
      const unit = activity.customFields?.productivityUnit;
      if (typeof unit !== 'string') return activity;
      return {
        ...activity,
        customFields: {
          ...activity.customFields,
          productivityUnit: normalizeEngineeringUnit(unit)
        }
      };
    }),
    boq: {
      ...project.boq,
      items: project.boq.items.map(normalizeBoqItem),
      revisions: project.boq.revisions.map((revision) => ({
        ...revision,
        items: revision.items.map(normalizeBoqItem)
      }))
    },
    riskResources: {
      ...project.riskResources,
      productivityPlans: project.riskResources.productivityPlans.map((plan) => ({
        ...plan,
        unit: normalizeEngineeringUnit(plan.unit)
      })),
      fieldRecords: project.riskResources.fieldRecords.map((record) => ({
        ...record,
        unit: normalizeEngineeringUnit(record.unit)
      })),
      resources: project.riskResources.resources.map((resource) => ({
        ...resource,
        unit: normalizeEngineeringUnit(resource.unit)
      }))
    }
  };
}

function normalizeBoqItem<T extends ProjectRecord['boq']['items'][number]>(item: T): T {
  return {
    ...item,
    unit: normalizeEngineeringUnit(item.unit),
    resources: item.resources.map((resource) => ({
      ...resource,
      unit: normalizeEngineeringUnit(resource.unit)
    }))
  };
}
