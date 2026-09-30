export const TIER_CONFIG = {
  P1_IMMEDIATE: {
    label: "P1 Immediate",
    code: "P1",
    sublabel: "Immediate Resuscitation / Critical Risk",
    badgeClass: "bg-red-50 text-red-700 border-red-200 font-semibold",
    borderClass: "border-l-4 border-l-red-600 border-slate-200 hover:border-slate-300",
    bgClass: "bg-white hover:bg-red-50/20",
    accentClass: "text-red-600",
    dotClass: "bg-red-600"
  },
  P2_URGENT: {
    label: "P2 Very Urgent",
    code: "P2",
    sublabel: "Emergent / High Clinical Acuity",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200 font-semibold",
    borderClass: "border-l-4 border-l-amber-500 border-slate-200 hover:border-slate-300",
    bgClass: "bg-white hover:bg-amber-50/20",
    accentClass: "text-amber-700",
    dotClass: "bg-amber-500"
  },
  P3_DELAYED: {
    label: "P3 Urgent",
    code: "P3",
    sublabel: "Moderate Acuity / Scheduled Monitoring",
    badgeClass: "bg-yellow-50 text-yellow-800 border-yellow-200 font-semibold",
    borderClass: "border-l-4 border-l-yellow-400 border-slate-200 hover:border-slate-300",
    bgClass: "bg-white hover:bg-yellow-50/20",
    accentClass: "text-yellow-700",
    dotClass: "bg-yellow-500"
  },
  P4_ROUTINE: {
    label: "P4 Standard",
    code: "P4",
    sublabel: "Low Acuity / Routine Intake",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
    borderClass: "border-l-4 border-l-emerald-500 border-slate-200 hover:border-slate-300",
    bgClass: "bg-white hover:bg-emerald-50/20",
    accentClass: "text-emerald-700",
    dotClass: "bg-emerald-500"
  }
};

export const getEffectiveTier = (patient) => {
  return patient.manual_override?.new_tier || patient.urgency?.tier || "P4_ROUTINE";
};

export const formatMinutes = (mins) => {
  if (mins === undefined || mins === null) return "--";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
};
