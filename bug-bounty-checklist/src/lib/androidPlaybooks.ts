import type { ChecklistCategory, ChecklistItem, TestingMethod } from "../types/checklist";
import { createItemMethod } from "./playbookStrategies";
/** Compatibility adapters. No substring routing or unrelated static fallback. */
export function generateAndroidPlaybookMethods(item: ChecklistItem, category: ChecklistCategory): TestingMethod[] {
  return item.methods?.length ? item.methods : [createItemMethod(item, category, "android")];
}
const forCategory = (item: ChecklistItem, id: string) => generateAndroidPlaybookMethods(item, { id, name: id, items: [item] });
export const getAndroidStaticItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-static");
export const getAndroidDynamicItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-dynamic");
export const getAndroidStorageItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-storage");
export const getAndroidCryptoItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-crypto");
export const getAndroidNetworkItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-network");
export const getAndroidIpcItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-ipc");
export const getAndroidReverseItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-reverse");
export const getAndroidHybridItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-hybrid");
export const getAndroidModernAuthItemPlaybook = (item: ChecklistItem) => forCategory(item, "android-modern-auth");
