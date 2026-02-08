"use client";

import React, { useMemo, useRef, useCallback, useState } from "react";
import { ReactFlowProvider } from "reactflow";

import EditorCanvas from "./components/EditorCanvas";
import LeftRail from "./components/EditorLeftRail";
import { EditorUIContext } from "./components/EditorUIContext";
import EditorBottomBar, { EditorBottomBarApi } from "./components/EditorBottomBar";

type EditorProps = {
  projectId: string;
  projectName: string;
  canEdit: boolean;
  initialNodes: any[];
  initialEdges: any[];
  initialTitle?: string;
};

export default function Editor({
  projectId,
  projectName,
  canEdit,
  initialNodes,
  initialEdges,
  initialTitle,
}: EditorProps) {
  // rail -> canvas (abre menú de nodos)
  const openCreateMenuRef = useRef<(() => void) | null>(null);
  const [pendingOpenCreateMenu, setPendingOpenCreateMenu] = useState(false);

  // canvas -> bottom bar
  const bottomBarApiRef = useRef<EditorBottomBarApi | null>(null);

  const openCreateMenu = useCallback(() => {
    const fn = openCreateMenuRef.current;
    if (fn) fn();
    else setPendingOpenCreateMenu(true);
  }, []);

  const uiValue = useMemo(() => ({ openCreateMenu }), [openCreateMenu]);

  return (
    <ReactFlowProvider>
      <EditorUIContext.Provider value={uiValue}>
        {/* ✅ ESTA ALTURA ES CLAVE */}
        <div className="flex h-full w-full overflow-hidden">
          <LeftRail />

          {/* ✅ contenedor que sí tiene altura */}
          <div className="relative flex-1 h-full min-h-0">
            <EditorCanvas
              projectId={projectId}
              canEdit={canEdit}
              initialNodes={initialNodes}
              initialEdges={initialEdges}
              initialTitle={initialTitle ?? projectName}
              openCreateMenuRef={openCreateMenuRef}
              pendingOpenCreateMenu={pendingOpenCreateMenu}
              clearPendingOpenCreateMenu={() => setPendingOpenCreateMenu(false)}
              bottomBarApiRef={bottomBarApiRef}
            />

            <EditorBottomBar apiRef={bottomBarApiRef} />
          </div>
        </div>
      </EditorUIContext.Provider>
    </ReactFlowProvider>
  );
}