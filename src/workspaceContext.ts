import { inject, provide, type InjectionKey } from "vue";
import { useWorkspace } from "./useWorkspace";
type Workspace = ReturnType<typeof useWorkspace>;
const workspaceKey: InjectionKey<Workspace> = Symbol("workspace");
export function provideWorkspace() {
  const workspace = useWorkspace();
  provide(workspaceKey, workspace);
  return workspace;
}
export function useWorkspaceContext() {
  const workspace = inject(workspaceKey);
  if (!workspace) throw new Error("Workspace provider is missing");
  return workspace;
}
