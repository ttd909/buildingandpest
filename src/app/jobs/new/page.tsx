"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInspectionStore } from "@/lib/store/useInspectionStore";
import { InspectionType, PropertyType } from "@/types";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  propertyAddress: z.string().min(5, "Enter a valid address"),
  clientName: z.string().min(2, "Enter client name"),
  clientEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  inspectionDate: z.string().min(1, "Select a date"),
  inspectionType: z.enum(["building", "pest", "combined"]),
  propertyType: z.enum(["house", "townhouse", "unit", "commercial"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewInspectionPage() {
  const router = useRouter();
  const { createInspection } = useInspectionStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      inspectionDate: new Date().toISOString().split("T")[0],
      inspectionType: "combined",
      propertyType: "house",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const insp = createInspection({
      propertyAddress: data.propertyAddress,
      clientName: data.clientName,
      clientEmail: data.clientEmail || undefined,
      inspectionDate: data.inspectionDate,
      inspectionType: data.inspectionType as InspectionType,
      propertyType: data.propertyType as PropertyType,
      notes: data.notes || undefined,
      companyName: "ProInspect Building & Pest",
      inspectorDetails: {
        name: "Michael Davies",
        licenceNumber: "VIC-BLD-04521",
        company: "ProInspect Building & Pest",
        phone: "0412 345 678",
        email: "michael@proinspect.com.au",
      },
    });
    router.push(`/jobs/${insp.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">New inspection</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Property section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Property details
          </h2>

          <Input
            label="Property address"
            placeholder="e.g. 14 Banksia Court, Mitcham VIC 3132"
            required
            error={errors.propertyAddress?.message}
            {...register("propertyAddress")}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Inspection type"
              required
              error={errors.inspectionType?.message}
              options={[
                { value: "building", label: "Building" },
                { value: "pest", label: "Pest" },
                { value: "combined", label: "Combined" },
              ]}
              {...register("inspectionType")}
            />
            <Select
              label="Property type"
              required
              error={errors.propertyType?.message}
              options={[
                { value: "house", label: "House" },
                { value: "townhouse", label: "Townhouse" },
                { value: "unit", label: "Unit/Apt" },
                { value: "commercial", label: "Commercial" },
              ]}
              {...register("propertyType")}
            />
          </div>

          <Input
            label="Inspection date"
            type="date"
            required
            error={errors.inspectionDate?.message}
            {...register("inspectionDate")}
          />
        </div>

        {/* Client section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Client details
          </h2>

          <Input
            label="Client name"
            placeholder="e.g. James & Sarah Thornton"
            required
            error={errors.clientName?.message}
            {...register("clientName")}
          />

          <Input
            label="Client email"
            type="email"
            placeholder="client@email.com.au"
            error={errors.clientEmail?.message}
            {...register("clientEmail")}
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <Textarea
            label="Notes (optional)"
            placeholder="Pre-purchase notes, access instructions, vendor disclosures..."
            rows={3}
            {...register("notes")}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="xl"
          loading={submitting}
          className="rounded-2xl"
        >
          Start inspection
        </Button>

        <div className="pb-8" />
      </form>
    </div>
  );
}
