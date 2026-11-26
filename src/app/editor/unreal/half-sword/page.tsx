import type { Metadata } from "next";
import UnrealGvasEditorClient from "@/components/UnrealGvasEditorClient";
import "../editor.css";

export const metadata: Metadata = {
  title: "Half Sword Save Editor Beta | EditorSaves",
  description:
    "Experimental local Half Sword progression-save editor for Player Funds, Character Height and Character Weight. Other nested save data is preserved read-only.",
  robots: {
    index: false,
    follow: true
  }
};

export default function HalfSwordSaveEditorPage() {
  return <UnrealGvasEditorClient profileOnly="half-sword" />;
}
