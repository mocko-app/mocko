import type { Metadata } from "next";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsLink,
  DocsP,
  DocsPage,
  DocsTitle,
  DocsUl,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Team Members",
  description:
    "Invite teammates to a Mocko Cloud project by GitHub username so a shared set of mocks lives in one place instead of being copied between machines.",
};

export default function CloudTeamPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Mocko Cloud</DocsEyebrow>
      <DocsTitle>Team Members</DocsTitle>
      <DocsLead>
        A project can be shared with other people so everyone works against the
        same mocks, flags, and host. Instead of passing a folder of definitions
        around, the whole team points at one project.
      </DocsLead>

      <Callout variant="info">Team members are currently in beta.</Callout>

      <DocsH2>Inviting someone</DocsH2>
      <DocsP>
        In the <DocsCode>Members</DocsCode> card of the project, invite a person
        by their GitHub username. They receive an invitation in Mocko that they
        can accept or reject from their notifications. Until they accept, they
        show up in the members list as <DocsCode>Invited</DocsCode>, so you can
        see who still has a pending invite.
      </DocsP>
      <DocsP>
        Because people are identified by GitHub username, the same account they
        signed in with is the one you invite. There is no separate email step.
      </DocsP>

      <DocsH2>Roles</DocsH2>
      <DocsP>
        Membership is intentionally simple. Every project has one owner and any
        number of members:
      </DocsP>
      <DocsUl>
        <li>
          <span className="text-foreground">Owner.</span> The person who created
          the project. Only the owner can change project settings, invite new
          people, and remove members.
        </li>
        <li>
          <span className="text-foreground">Member.</span> Someone who accepted
          an invitation. Members work in the project alongside the owner and can
          leave it at any time.
        </li>
      </DocsUl>

      <DocsH2>Removing access</DocsH2>
      <DocsP>
        The owner can remove any member from the members list, and a member can
        remove themselves to leave a project they no longer need. Once removed,
        that person no longer sees the project or its host among their own.
      </DocsP>

      <Callout variant="tip">
        Sharing a project shares its public host too, so a mock a teammate adds
        is immediately live on the same URL your clients already use. Watch what
        everyone&apos;s changes do to real traffic in{" "}
        <DocsLink href="/cloud/logs">Request Logs</DocsLink>.
      </Callout>
    </DocsPage>
  );
}
