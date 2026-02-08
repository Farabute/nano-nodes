"use client";

import React, { createContext, useContext } from "react";

type EditorUIValue = {
  openCreateMenu: () => void;
};

export const EditorUIContext = createContext<EditorUIValue | null>(null);

export function useEditorUI() {
  const ctx = useContext(EditorUIContext);
  if (!ctx) {
    throw new Error("useEditorUI must be used within EditorUIContext.Provider");
  }
  return ctx;
}