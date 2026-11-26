import type { UnrealGvasProperty } from "./index";

export type UnrealGvasGameProfileId = "half-sword";

export interface UnrealGvasProfileField {
  propertyName: string;
  propertyType: string;
  propertyPath: string;
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
    "This exact progression class is present in seven private reference samples. The verified map exposes Player Funds plus the nested Height and Weight doubles from Player Character; other character, equipment and inventory structures remain read-only.",
  fields: [
    {
      propertyName: "Player Funds",
      propertyType: "IntProperty",
      propertyPath: "Player Funds",
      label: "Player Funds",
      description: "Top-level 32-bit integer present in the Half Sword progression samples."
    },
    {
      propertyName: "Height_21_0EB204DF4978B92AD0ED188FD32EEC7B",
      propertyType: "DoubleProperty",
      propertyPath: "Player Character.Height_21_0EB204DF4978B92AD0ED188FD32EEC7B",
      label: "Character Height",
      description: "64-bit double inside Player Character (Str_Passport_Character1), confirmed in all seven matching samples."
    },
    {
      propertyName: "Weight_23_65E4C6534D14653F96EB739F159E58CD",
      propertyType: "DoubleProperty",
      propertyPath: "Player Character.Weight_23_65E4C6534D14653F96EB739F159E58CD",
      label: "Character Weight / Strength",
      description: "64-bit double inside Player Character (Str_Passport_Character1), confirmed in all seven matching samples."
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
  property: Pick<UnrealGvasProperty, "name" | "type" | "path">
): UnrealGvasProfileField | null {
  return profile.fields.find(
    (field) =>
      field.propertyName === property.name &&
      field.propertyType === property.type &&
      field.propertyPath === (property.path ?? property.name)
  ) ?? null;
}

export function isUnrealGvasProfileFieldEditable(
  profile: UnrealGvasGameProfile,
  property: Pick<UnrealGvasProperty, "name" | "type" | "path">
): boolean {
  return getUnrealGvasProfileField(profile, property) !== null;
}
