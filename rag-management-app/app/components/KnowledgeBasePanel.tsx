"use client"

import CollapsibleSection from "./CollapsibleSection"
import NotebookList from "./NotebookList"

export default function KnowledgeBasePanel() {
  return (
    <CollapsibleSection
      title="Knowledge Base Management"
      icon="📚"
      defaultOpen={false}
    >
      <NotebookList />
    </CollapsibleSection>
  )
}
