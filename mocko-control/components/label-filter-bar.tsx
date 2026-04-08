"use client";

import {
  labelStyle,
  labelStyleSelected,
  UNLABELED_KEY,
  UNLABELED_STYLE,
  UNLABELED_STYLE_SELECTED,
} from "@/lib/utils/labels";

type LabelFilterBarProps = {
  visibleLabels: string[];
  hasUnlabeled: boolean;
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
};

export function LabelFilterBar({
  visibleLabels,
  hasUnlabeled,
  selectedLabels,
  onChange,
}: LabelFilterBarProps) {
  if (visibleLabels.length === 0 && !hasUnlabeled) return null;

  const unlabeledSelected = selectedLabels.includes(UNLABELED_KEY);
  const allKeys = [
    ...visibleLabels.filter((l) => selectedLabels.includes(l)),
    ...(unlabeledSelected ? [UNLABELED_KEY] : []),
    ...visibleLabels.filter((l) => !selectedLabels.includes(l)),
  ];
  if (hasUnlabeled && !unlabeledSelected) allKeys.push(UNLABELED_KEY);

  function toggle(key: string) {
    if (selectedLabels.includes(key)) {
      onChange(selectedLabels.filter((l) => l !== key));
    } else {
      onChange([...selectedLabels, key]);
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {allKeys.map((key) => {
        const isUnlabeled = key === UNLABELED_KEY;
        const selected = selectedLabels.includes(key);
        const style = isUnlabeled
          ? selected
            ? UNLABELED_STYLE_SELECTED
            : UNLABELED_STYLE
          : selected
            ? labelStyleSelected(key)
            : labelStyle(key);

        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            style={style}
            className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
          >
            {isUnlabeled ? "Unlabeled" : key}
          </button>
        );
      })}
    </div>
  );
}
