import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  Inspection,
  InspectionArea,
  Finding,
  InspectionStatus,
  AreaCaptureSession,
  INSPECTION_AREAS,
} from "@/types";
import { DEMO_INSPECTIONS } from "@/data/demo";
import { saveInspection, loadAllInspections } from "@/lib/storage/db";

interface SaveStatus {
  status: "idle" | "saving" | "saved" | "error";
  lastSaved?: Date;
}

interface InspectionStore {
  inspections: Inspection[];
  saveStatus: SaveStatus;
  initialized: boolean;

  // Bootstrap
  initialize: () => Promise<void>;
  loadDemo: () => Promise<void>;

  // Inspection CRUD
  createInspection: (data: Omit<Inspection, "id" | "createdAt" | "updatedAt" | "areas" | "status">) => Inspection;
  updateInspection: (id: string, updates: Partial<Inspection>) => void;
  deleteInspection: (id: string) => void;
  getInspection: (id: string) => Inspection | undefined;

  // Area management
  addArea: (inspectionId: string, areaName: string, isCustom?: boolean) => void;
  removeArea: (inspectionId: string, areaId: string) => void;
  reorderAreas: (inspectionId: string, areaIds: string[]) => void;

  // Session (live area capture)
  saveSession: (inspectionId: string, areaId: string, session: AreaCaptureSession) => void;
  updateSession: (inspectionId: string, areaId: string, updates: Partial<AreaCaptureSession>) => void;

  // Finding CRUD
  addFinding: (inspectionId: string, areaId: string, finding: Finding) => void;
  addFindings: (inspectionId: string, areaId: string, findings: Finding[]) => void;
  updateFinding: (inspectionId: string, areaId: string, findingId: string, updates: Partial<Finding>) => void;
  deleteFinding: (inspectionId: string, areaId: string, findingId: string) => void;
  moveFinding: (inspectionId: string, fromAreaId: string, toAreaId: string, findingId: string) => void;

  // Status
  setStatus: (inspectionId: string, status: InspectionStatus) => void;

  // Persistence
  persist: (inspectionId: string) => Promise<void>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultAreas(): InspectionArea[] {
  return INSPECTION_AREAS.map((name, i) => ({
    id: generateId(),
    name,
    isCustom: false,
    order: i,
    findings: [],
  }));
}

export const useInspectionStore = create<InspectionStore>()(
  subscribeWithSelector((set, get) => ({
    inspections: [],
    saveStatus: { status: "idle" },
    initialized: false,

    initialize: async () => {
      if (get().initialized) return;
      const persisted = await loadAllInspections();
      set({ inspections: persisted, initialized: true });
    },

    loadDemo: async () => {
      const existingIds = new Set(get().inspections.map((i) => i.id));
      const toAdd = DEMO_INSPECTIONS.filter((d) => !existingIds.has(d.id));
      if (toAdd.length === 0) return;
      set((s) => ({ inspections: [...toAdd, ...s.inspections] }));
      for (const insp of toAdd) {
        await saveInspection(insp);
      }
    },

    createInspection: (data) => {
      const inspection: Inspection = {
        ...data,
        id: generateId(),
        status: "draft",
        areas: buildDefaultAreas(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({ inspections: [inspection, ...s.inspections] }));
      get().persist(inspection.id);
      return inspection;
    },

    updateInspection: (id, updates) => {
      set((s) => ({
        inspections: s.inspections.map((insp) =>
          insp.id === id ? { ...insp, ...updates, updatedAt: new Date().toISOString() } : insp
        ),
      }));
      get().persist(id);
    },

    deleteInspection: (id) => {
      set((s) => ({ inspections: s.inspections.filter((i) => i.id !== id) }));
    },

    getInspection: (id) => get().inspections.find((i) => i.id === id),

    addArea: (inspectionId, areaName, isCustom = false) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          const newArea: InspectionArea = {
            id: generateId(),
            name: areaName,
            isCustom,
            order: insp.areas.length,
            findings: [],
          };
          return { ...insp, areas: [...insp.areas, newArea], updatedAt: new Date().toISOString() };
        }),
      }));
      get().persist(inspectionId);
    },

    removeArea: (inspectionId, areaId) => {
      set((s) => ({
        inspections: s.inspections.map((insp) =>
          insp.id !== inspectionId ? insp : {
            ...insp,
            areas: insp.areas.filter((a) => a.id !== areaId),
            updatedAt: new Date().toISOString(),
          }
        ),
      }));
      get().persist(inspectionId);
    },

    reorderAreas: (inspectionId, areaIds) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          const reordered = areaIds
            .map((id, i) => {
              const area = insp.areas.find((a) => a.id === id);
              return area ? { ...area, order: i } : null;
            })
            .filter(Boolean) as InspectionArea[];
          return { ...insp, areas: reordered, updatedAt: new Date().toISOString() };
        }),
      }));
      get().persist(inspectionId);
    },

    saveSession: (inspectionId, areaId, session) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          return {
            ...insp,
            status: insp.status === "draft" ? "in_progress" : insp.status,
            areas: insp.areas.map((area) =>
              area.id !== areaId ? area : { ...area, session }
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      get().persist(inspectionId);
    },

    updateSession: (inspectionId, areaId, updates) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          return {
            ...insp,
            areas: insp.areas.map((area) =>
              area.id !== areaId || !area.session
                ? area
                : { ...area, session: { ...area.session, ...updates } }
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      get().persist(inspectionId);
    },

    addFinding: (inspectionId, areaId, finding) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          return {
            ...insp,
            status: insp.status === "draft" ? "in_progress" : insp.status,
            areas: insp.areas.map((area) =>
              area.id !== areaId ? area : { ...area, findings: [...area.findings, finding] }
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      get().persist(inspectionId);
    },

    addFindings: (inspectionId, areaId, findings) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          return {
            ...insp,
            status: insp.status === "draft" ? "in_progress" : insp.status,
            areas: insp.areas.map((area) =>
              area.id !== areaId ? area : { ...area, findings: [...area.findings, ...findings] }
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      get().persist(inspectionId);
    },

    updateFinding: (inspectionId, areaId, findingId, updates) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          return {
            ...insp,
            areas: insp.areas.map((area) =>
              area.id !== areaId ? area : {
                ...area,
                findings: area.findings.map((f) => f.id !== findingId ? f : { ...f, ...updates }),
              }
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      get().persist(inspectionId);
    },

    deleteFinding: (inspectionId, areaId, findingId) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          return {
            ...insp,
            areas: insp.areas.map((area) =>
              area.id !== areaId ? area : {
                ...area,
                findings: area.findings.filter((f) => f.id !== findingId),
              }
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      get().persist(inspectionId);
    },

    moveFinding: (inspectionId, fromAreaId, toAreaId, findingId) => {
      set((s) => ({
        inspections: s.inspections.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          const fromArea = insp.areas.find((a) => a.id === fromAreaId);
          const finding = fromArea?.findings.find((f) => f.id === findingId);
          if (!finding) return insp;
          return {
            ...insp,
            areas: insp.areas.map((area) => {
              if (area.id === fromAreaId) {
                return { ...area, findings: area.findings.filter((f) => f.id !== findingId) };
              }
              if (area.id === toAreaId) {
                return { ...area, findings: [...area.findings, { ...finding, areaName: area.name }] };
              }
              return area;
            }),
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      get().persist(inspectionId);
    },

    setStatus: (inspectionId, status) => {
      get().updateInspection(inspectionId, { status });
    },

    persist: async (inspectionId) => {
      const inspection = get().inspections.find((i) => i.id === inspectionId);
      if (!inspection) return;

      set({ saveStatus: { status: "saving" } });
      try {
        await saveInspection(inspection);
        set({ saveStatus: { status: "saved", lastSaved: new Date() } });
        setTimeout(() => set({ saveStatus: { status: "idle" } }), 2000);
      } catch {
        set({ saveStatus: { status: "error" } });
      }
    },
  }))
);
