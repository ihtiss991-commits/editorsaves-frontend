import type { Metadata } from "next";
import UnrealGvasEditorClient from "@/components/UnrealGvasEditorClient";
import "./editor.css";

export const metadata: Metadata = {
  title: "Unreal Engine GVAS Save Editor Beta",
  description:
    "Inspect and edit supported Unreal Engine GVAS save properties locally in your browser. Unknown structures are preserved; compatibility varies by game and engine version.",
  robots: {
    index: false,
    follow: true
  }
};

export default function UnrealGvasEditorPage() {
  return <UnrealGvasEditorClient />;
}
