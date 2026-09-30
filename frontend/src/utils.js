export const TIER_CONFIG = {
  P1_IMMEDIATE: {
    label: "P1 IMMEDIATE",
    code: "P1",
    sublabel: "Immediate Resuscitation / Critical Risk",
    badgeClass: "bg-red-50 text-red-800 border-red-300 font-bold",
    pillClass: "bg-red-600 text-white font-bold",
    borderClass: "border-l-4 border-l-red-600 border-slate-200",
    bgClass: "bg-white hover:bg-slate-50/80",
    accentClass: "text-red-700",
    dotClass: "bg-red-600"
  },
  P2_URGENT: {
    label: "P2 VERY URGENT",
    code: "P2",
    sublabel: "Emergent / High Acuity",
    badgeClass: "bg-amber-50 text-amber-900 border-amber-300 font-bold",
    pillClass: "bg-amber-600 text-white font-bold",
    borderClass: "border-l-4 border-l-amber-500 border-slate-200",
    bgClass: "bg-white hover:bg-slate-50/80",
    accentClass: "text-amber-800",
    dotClass: "bg-amber-500"
  },
  P3_DELAYED: {
    label: "P3 URGENT",
    code: "P3",
    sublabel: "Moderate Acuity / Scheduled Monitoring",
    badgeClass: "bg-yellow-50 text-yellow-900 border-yellow-300 font-bold",
    pillClass: "bg-yellow-600 text-white font-bold",
    borderClass: "border-l-4 border-l-yellow-400 border-slate-200",
    bgClass: "bg-white hover:bg-slate-50/80",
    accentClass: "text-yellow-800",
    dotClass: "bg-yellow-500"
  },
  P4_ROUTINE: {
    label: "P4 STANDARD",
    code: "P4",
    sublabel: "Low Acuity / Routine Intake",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300 font-bold",
    pillClass: "bg-slate-600 text-white font-bold",
    borderClass: "border-l-4 border-l-slate-400 border-slate-200",
    bgClass: "bg-white hover:bg-slate-50/80",
    accentClass: "text-slate-700",
    dotClass: "bg-slate-400"
  }
};

export const getEffectiveTier = (patient) => {
  return patient?.manual_override?.new_tier || patient?.urgency?.tier || "P4_ROUTINE";
};

export const formatMinutes = (mins) => {
  if (mins === undefined || mins === null) return "--";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
};

export const formatDateTime = (isoString) => {
  if (!isoString) return "--";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};
