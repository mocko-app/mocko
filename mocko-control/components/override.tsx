import Link from "next/link";
import { Callout } from "@/components/callout";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/frontend/api";

export const OverrideButton: React.FC<{ href: string }> = ({ href }) => (
  <Button
    variant="outline"
    size="sm"
    nativeButton={false}
    render={<Link href={href} />}
  >
    Override
  </Button>
);

export const OverrideSourceNotice: React.FC<{
  entity: string;
  error: ApiError | undefined;
}> = ({ entity, error }) => {
  const capitalized = entity.charAt(0).toUpperCase() + entity.slice(1);
  if (error instanceof ApiError && error.status === 404) {
    return (
      <Callout
        title={`${capitalized} not found`}
        message={`The ${entity} to override does not exist or is no longer available.`}
      />
    );
  }

  return (
    <Callout
      title={`Could not load ${entity}`}
      message="Refresh the page or restart Mocko."
    />
  );
};
