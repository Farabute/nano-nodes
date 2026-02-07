"use client";

import { createContext, useContext } from "react";

type EditorUIContextType = {
  openCreateMenu?: () => void;
};

export const EditorUIContext = createContext<EditorUIContextType>({});

export function useEditorUI() {
  return useContext(EditorUIContext);
}