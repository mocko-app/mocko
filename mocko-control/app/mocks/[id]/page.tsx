import { use } from "react";
import { notFound } from "next/navigation";
import { MockForm } from "@/components/mock-form";
import { FIXTURE_MOCKS } from "@/lib/mock/mock.fixtures";

export default function EditMockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const mock = FIXTURE_MOCKS.find((m) => m.id === id);

  if (!mock) {
    notFound();
  }

  return <MockForm mode="edit" initial={mock} />;
}
