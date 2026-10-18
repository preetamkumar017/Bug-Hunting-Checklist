// Aggregates per-leaf topic content. Each file is owned by one content area.
import type { TopicContent } from "@/learn/data/types";
import { webInjectionTopics } from "@/learn/data/topics/web-injection";
import { webAuthTopics } from "@/learn/data/topics/web-auth";
import { serverMisconfig1Topics } from "@/learn/data/topics/server-misconfig-1";
import { serverMisconfig2Topics } from "@/learn/data/topics/server-misconfig-2";
import { dataExposureTopics } from "@/learn/data/topics/data-exposure";
import { cryptoTopics } from "@/learn/data/topics/crypto";
import { mobileDeviceTopics } from "@/learn/data/topics/mobile-device";
import { web3Topics } from "@/learn/data/topics/web3";
import { aiCloudNetworkTopics } from "@/learn/data/topics/ai-cloud-network";

export const topicContent: Record<string, TopicContent> = {
  ...webInjectionTopics,
  ...webAuthTopics,
  ...serverMisconfig1Topics,
  ...serverMisconfig2Topics,
  ...dataExposureTopics,
  ...cryptoTopics,
  ...mobileDeviceTopics,
  ...web3Topics,
  ...aiCloudNetworkTopics,
};
