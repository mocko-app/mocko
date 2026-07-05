import type { Metadata } from "next";
import { LegacyBanner } from "@/components/docs/legacy-banner";
import {
  DocsCode,
  DocsCodeBlock,
  DocsH2,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = { title: "Deploying (v1)" };

export default function V1DeployingPage() {
  return (
    <DocsPage>
      <LegacyBanner />
      <DocsTitle>Deploying</DocsTitle>
      <DocsP>
        Get Mocko running on the internet so you can access it from anywhere,
        not just your local machine.
      </DocsP>

      <DocsH2>Standalone mode — Docker</DocsH2>
      <DocsP>
        To run Mocko with as few resources as possible, build a container image
        using <DocsCode>gabrielctpinheiro/mocko-proxy</DocsCode> as a base.
        Create this structure:
      </DocsP>
      <DocsCodeBlock>{`mocko-project
├── Dockerfile
└── mocks
    └── main.hcl`}</DocsCodeBlock>
      <DocsP>
        In your <DocsCode>Dockerfile</DocsCode>:
      </DocsP>
      <DocsCodeBlock>{`FROM 'gabrielctpinheiro/mocko-proxy'
COPY ./mocks ./mocks`}</DocsCodeBlock>
      <DocsP>
        To override settings, set environment variables in the Dockerfile:
      </DocsP>
      <DocsCodeBlock>{`FROM 'gabrielctpinheiro/mocko-proxy'
COPY ./mocks ./mocks
ENV PROXY_BASE-URI=https://my-real-api.tld/v1`}</DocsCodeBlock>
      <DocsP>
        All available environment variables and their defaults are listed in{" "}
        <a
          href="https://github.com/mocko-app/mocko/blob/master/mocko-proxy/default.env"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          mocko-proxy/default.env
        </a>
        .
      </DocsP>

      <DocsH2>Complete stack on Kubernetes with Helm</DocsH2>
      <DocsP>
        Install the complete stack (proxy + control UI + Redis) in your cluster
        with three commands.
      </DocsP>
      <DocsP>Helm 3:</DocsP>
      <DocsCodeBlock>{`$ git clone https://github.com/mocko-app/mocko.git
$ cd mocko

$ helm install mocko ./mocko-helm --set \\
  redis.host=YOUR.REDIS.HOST,\\
  redis.password=YOUR_REDIS_PASSWORD,\\
  proxy.uri=http://your-real-api.url/v1`}</DocsCodeBlock>
      <DocsP>Helm 2:</DocsP>
      <DocsCodeBlock>{`$ git clone https://github.com/mocko-app/mocko.git
$ cd mocko

$ helm install ./mocko-helm -n mocko --set \\
  redis.host=YOUR.REDIS.HOST,\\
  redis.password=YOUR_REDIS_PASSWORD,\\
  proxy.uri=http://your-real-api.url/v1`}</DocsCodeBlock>

      <DocsP>Other chart values you may want to configure:</DocsP>
      <div className="mb-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                Chart value
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                Description
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                Default
              </th>
            </tr>
          </thead>
          <tbody className="text-fg-2">
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono">proxy.uri</td>
              <td className="px-4 py-2.5">
                URL of your actual API to proxy; leave blank to disable
              </td>
              <td className="px-4 py-2.5 italic">blank</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono">proxy.timeoutMillis</td>
              <td className="px-4 py-2.5">
                Milliseconds before replying with 504 Gateway Timeout
              </td>
              <td className="px-4 py-2.5 font-mono">180000</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono">proxy.cors</td>
              <td className="px-4 py-2.5">
                Override CORS rules (true) or proxy OPTIONS to the API (false)
              </td>
              <td className="px-4 py-2.5 font-mono">true</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono">proxy.replicas</td>
              <td className="px-4 py-2.5">Number of proxy replicas</td>
              <td className="px-4 py-2.5 font-mono">1</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono">redis.host</td>
              <td className="px-4 py-2.5">Redis host</td>
              <td className="px-4 py-2.5 font-mono text-[12px]">
                redis-headless.default.svc.cluster.local
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono">redis.port</td>
              <td className="px-4 py-2.5">Redis port</td>
              <td className="px-4 py-2.5 font-mono">6379</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono">redis.password</td>
              <td className="px-4 py-2.5">Redis password</td>
              <td className="px-4 py-2.5 italic">blank</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-mono">redis.database</td>
              <td className="px-4 py-2.5">Redis database index</td>
              <td className="px-4 py-2.5 font-mono">0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DocsPage>
  );
}
