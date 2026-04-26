"use client";

import React from "react";
import Link from "next/link";
import { buildFlagListUrl } from "@/lib/flag/flag-list-url";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type FlagCrumbsProps = {
  crumbs: string[];
  query?: string;
  className?: string;
};

export function FlagCrumbs({ crumbs, query, className }: FlagCrumbsProps) {
  const allCrumbs = ["Flags", ...crumbs];

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {allCrumbs.map((crumb, index) => {
          const isCurrent = index === allCrumbs.length - 1;
          const prefix =
            index === 0 ? undefined : `${crumbs.slice(0, index).join(":")}:`;
          const href = isCurrent
            ? undefined
            : buildFlagListUrl("/flags", prefix, query);

          return (
            <React.Fragment key={`${crumb}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {href ? (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {crumb}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
