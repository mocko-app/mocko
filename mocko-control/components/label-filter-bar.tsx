"use client";

import { Button } from "@/components/ui/button";
import {
  labelStyle,
  labelStyleSelected,
  UNLABELED_KEY,
  UNLABELED_STYLE,
  UNLABELED_STYLE_SELECTED,
} from "@/lib/utils/labels";
import {
  getOrderedLabelFilterKeys,
  isLabelFilterSelected,
  toggleLabelFilter,
} from "@/lib/mock/filter";

type LabelFilterBarProps = {
  visibleLabels: string[];
  hasUnlabeled: boolean;
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
};

function getLabelFilterSelected(
  key: string,
  selectedLabels: string[],
  unlabeledSelected: boolean,
): boolean {
  if (key === UNLABELED_KEY) {
    return unlabeledSelected;
  }

  return isLabelFilterSelected(key, selectedLabels);
}

function getLabelFilterStyle(
  key: string,
  selected: boolean,
): React.CSSProperties {
  if (key === UNLABELED_KEY) {
    if (selected) {
      return UNLABELED_STYLE_SELECTED;
    }

    return UNLABELED_STYLE;
  }

  if (selected) {
    return labelStyleSelected(key);
  }

  return labelStyle(key);
}

function getLabelFilterText(key: string): string {
  if (key === UNLABELED_KEY) {
    return "Unlabeled";
  }

  return key;
}

export function LabelFilterBar({
  visibleLabels,
  hasUnlabeled,
  selectedLabels,
  onChange,
}: LabelFilterBarProps) {
  if (visibleLabels.length === 0 && !hasUnlabeled) return null;

  const unlabeledSelected = selectedLabels.includes(UNLABELED_KEY);
  const allKeys = getOrderedLabelFilterKeys(
    visibleLabels,
    selectedLabels,
    hasUnlabeled,
  );

  function toggle(key: string) {
    onChange(toggleLabelFilter(selectedLabels, key));
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {allKeys.map((key) => {
        const selected = getLabelFilterSelected(
          key,
          selectedLabels,
          unlabeledSelected,
        );
        const style = getLabelFilterStyle(key, selected);

        return (
          <Button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            variant="outline"
            size="xs"
            style={style}
            className="h-auto shrink-0 rounded-full px-2.5 py-1 text-xs"
          >
            {getLabelFilterText(key)}
          </Button>
        );
      })}
    </div>
  );
}
