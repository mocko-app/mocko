"use client";

import { Button } from "@/components/ui/button";
import {
  labelStyle,
  labelStyleSelected,
  UNLABELED_KEY,
  UNLABELED_STYLE,
  UNLABELED_STYLE_SELECTED,
} from "@/lib/utils/labels";
import { isLabelFilterSelected, toggleLabelFilter } from "@/lib/mock/filter";

type LabelFilterBarProps = {
  labelKeys: string[];
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
};

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
  labelKeys,
  selectedLabels,
  onChange,
}: LabelFilterBarProps) {
  if (labelKeys.length === 0) return null;

  function toggle(key: string) {
    onChange(toggleLabelFilter(selectedLabels, key));
  }

  return (
    <div
      role="group"
      aria-label="Filter mocks by label"
      className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
    >
      {labelKeys.map((key) => {
        const selected = isLabelFilterSelected(key, selectedLabels);
        const style = getLabelFilterStyle(key, selected);

        return (
          <Button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            aria-pressed={selected}
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
