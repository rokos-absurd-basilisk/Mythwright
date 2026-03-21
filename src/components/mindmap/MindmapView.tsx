import { useCallback } from 'react'
import { ReactFlow, addEdge, MiniMap, Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState, type Node, type Edge, type Connection, type NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBoundStore, useBeats } from '../../store'
import { type Beat } from '../../types'

// ── Custom beat node ─────────────────────────────────────────────
function BeatNode({ data }: { data: { label: string; labelColour: string; synopsis?: string } }) {
  return (
    <div className="relative rounded-[10px] border border-[var(--border)] min-w-[140px] max-w-[200px] cursor-pointer"
      style={{ background: 'var(--bg-card)' }}>
      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ background: data.labelColour || 'var(--accent-teal)' }} />
      <div className="px-3 py-2 pl-4">
        <p className="font-[family-name:var(--font-heading)] font-semibold text-[12px] text-[var(--text-primary)] uppercase tracking-wide leading-snug">
          {data.label}
        </p>
        {data.synopsis && (
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">{data.synopsis}</p>
        )}
      </div>
    </div>
  )
}

const NODE_TYPES: NodeTypes = { beatNode: BeatNode as never }

function beatsToNodes(beats: Beat[]): Node[] {
  return beats.map((b, i) => ({
    id: b.id,
    type: 'beatNode',
    position: { x: (i % 4) * 260, y: Math.floor(i / 4) * 160 },
    data: { label: b.title || 'Untitled', labelColour: b.labelColour, synopsis: b.synopsis },
  }))
}

export function MindmapView({ outlineId }: { outlineId: string }) {
  const beats = useBeats(outlineId)
  const setSelectedBeat = useBoundStore(s => s.setSelectedBeat)
  const addBeat = useBoundStore(s => s.addBeat)

  const initialNodes = beatsToNodes(beats)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({
      ...params, animated: true,
      style: { stroke: 'var(--accent-teal)', strokeWidth: 2 },
    }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedBeat(node.id)
  }, [setSelectedBeat])

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.react-flow__node')) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const beat = addBeat(outlineId, 'New Beat', {
      xPosition: (e.clientX - rect.left) / rect.width,
      yPosition: (e.clientY - rect.top) / rect.height,
    })
    setNodes(ns => [...ns, {
      id: beat.id, type: 'beatNode',
      position: { x: e.clientX - rect.left - 70, y: e.clientY - rect.top - 30 },
      data: { label: beat.title, labelColour: beat.labelColour, synopsis: '' },
    }])
  }, [outlineId, addBeat, setNodes])

  return (
    <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDoubleClick={onDoubleClick}
        nodeTypes={NODE_TYPES}
        fitView
        attributionPosition="bottom-left"
        style={{ background: 'var(--bg-primary)' }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: 'var(--accent-teal)', strokeWidth: 2 },
        }}
      >
        <MiniMap
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          nodeColor={() => 'var(--accent-teal)'}
          maskColor="rgba(13,38,38,0.7)"
        />
        <Controls style={{ border: '1px solid var(--border)' }} />
        <Background variant={BackgroundVariant.Dots}
          color="var(--border)" gap={24} size={1} />
      </ReactFlow>

      {beats.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-[13px] text-[var(--text-muted)]">Double-click anywhere to add a node</p>
        </div>
      )}
    </div>
  )
}
