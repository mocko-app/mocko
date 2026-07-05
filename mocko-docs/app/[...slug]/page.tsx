import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  DocsEyebrow,
  DocsLead,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";
import {
  findNavItemBySlug,
  getNavGroupTitleForHref,
  getTitleFromSlug,
  placeholderNavItems,
} from "@/components/docs/nav-data";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return placeholderNavItems.map((item) => ({
    slug: item.href.replace(/^\//, "").split("/"),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = findNavItemBySlug(slug);

  if (!item) {
    return {};
  }

  return {
    title: item.title,
    description: `${item.title} documentation for Mocko.`,
  };
}

export default async function DocsPlaceholderPage({ params }: Props) {
  const { slug } = await params;
  const item = findNavItemBySlug(slug);

  if (!item) {
    notFound();
  }

  const title = getTitleFromSlug(slug);
  const sectionTitle = getNavGroupTitleForHref(item.href);

  return (
    <DocsPage>
      <DocsEyebrow>{sectionTitle ?? "Documentation"}</DocsEyebrow>
      <DocsTitle>{title}</DocsTitle>
      <DocsLead>
        This page is reserved in the navigation and will be filled in as the
        rest of the docs are migrated into the new site.
      </DocsLead>
      <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
        For now, use the quickstart to get a working mock locally, then return
        here when this section is ready.
      </p>
      <div className="mt-8">
        <Link href="/getting-started" className={buttonVariants()}>
          Open quickstart
        </Link>
      </div>
    </DocsPage>
  );
}
