import type { UnrealGvasProperty } from "./index";

export type UnrealGvasGameProfileId = "half-sword";

export interface UnrealGvasProfileField {
  propertyName: string;
  propertyType: string;
  label: string;
  description: string;
}

export interface UnrealGvasGameProfile {
  id: UnrealGvasGameProfileId;
  gameName: string;
  saveType: string;
  saveGameClassName: string;
  description: string;
  fields: readonly UnrealGvasProfileField[];
}

export const HALF_SWORD_GAME_PROGRESS_CLASS =
  "/Game/Blueprints/SaveGame/SG_GameProgress.SG_GameProgress_C";

export const HALF_SWORD_PROFILE: UnrealGvasGameProfile = {
  id: "half-sword",
  gameName: "Half Sword",
  saveType: "Progression save",
  saveGameClassName: HALF_SWORD_GAME_PROGRESS_CLASS,
  description:
    "This exact progression class was found in the private reference corpus. The current game-specific map exposes only the top-level Player Funds integer; nested character and inventory data remain read-only.",
  fields: [
    {
      propertyName: "Player Funds",
      propertyType: "IntProperty",
      label: "Player Funds",
      description:
        "Top-level IntProperty confirmed in the Half Sword GameProgress samples and community save-editing references. Its original 32-bit integer representation is preserved."
    }
  ]
};

const PROFILES: readonly UnrealGvasGameProfile[] = [HALF_SWORD_PROFILE];

export function detectUnrealGvasGameProfile(
  saveGameClassName: string | null | undefined
): UnrealGvasGameProfile | null {
  if (!saveGameClassName) return null;
  return PROFILES.find((profile) => profile.saveGameClassName === saveGameClassName) ?? null;
}

export function getUnrealGvasProfileField(
  profile: UnrealGvasGameProfile,
  property: Pick<UnrealGvasProperty, "name" | "type">
): UnrealGvasProfileField | null {
  return profile.fields.find(
    (field) => field.propertyName === property.name && field.propertyType === property.type
  ) ?? null;
}

export function isUnrealGvasProfileFieldEditable(
  profile: UnrealGvasGameProfile,
  property: Pick<UnrealGvasProperty, "name" | "type">
): boolean {
  return getUnrealGvasProfileField(profile, property) !== null;
}
