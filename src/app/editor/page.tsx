import type { Metadata } from "next";
import SaveEditorClient from "@/components/SaveEditorClient";
import "./editor.css";

export const metadata: Metadata = {
  title: "RPG Maker MV and MZ Save Editor Beta",
  description:
    "Experimentally edit recognized RPG Maker MV and MZ slot saves in your browser. Compatibility is limited to known fields and is not verified for every game or plugin.",
  robots: {
    index: false,
    follow: true
  }
};

export default function EditorPage() {
  return <SaveEditorClient />;
}
