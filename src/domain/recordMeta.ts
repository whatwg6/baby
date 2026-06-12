import { Baby, Camera, Moon, NotebookPen, Ruler, Syringe, type LucideIcon } from "lucide-react";
import type { RecordType } from "./types";

type RecordMeta = {
  label: string;
  actionLabel: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
};

export const recordTypeOrder = ["journal", "photo", "growth", "sleep", "vaccine", "milestone"] as const satisfies readonly RecordType[];

const _recordTypeOrderIsExhaustive: Record<Exclude<RecordType, (typeof recordTypeOrder)[number]>, never> = {};
void _recordTypeOrderIsExhaustive;

export const recordMeta = {
  journal: {
    label: "日记",
    actionLabel: "写日记",
    icon: NotebookPen,
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  photo: {
    label: "照片",
    actionLabel: "传照片",
    icon: Camera,
    colorClass: "text-coral",
    bgClass: "bg-coral/10",
  },
  growth: {
    label: "身高体重",
    actionLabel: "记身高体重",
    icon: Ruler,
    colorClass: "text-dataBlue",
    bgClass: "bg-dataBlue/10",
  },
  sleep: {
    label: "睡眠",
    actionLabel: "记睡眠",
    icon: Moon,
    colorClass: "text-ink",
    bgClass: "bg-ink/10",
  },
  vaccine: {
    label: "疫苗",
    actionLabel: "记疫苗",
    icon: Syringe,
    colorClass: "text-success",
    bgClass: "bg-success/10",
  },
  milestone: {
    label: "里程碑",
    actionLabel: "加里程碑",
    icon: Baby,
    colorClass: "text-warning",
    bgClass: "bg-warning/10",
  },
} as const satisfies Record<RecordType, RecordMeta>;
