import React, { useCallback, useEffect } from 'react'
import {
  ReactFlow, addEdge, MiniMap, Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState, type Node, type Edge, type Connection, type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBoundStore, useBeats } from '../../store'
import { type Beat } from '../../types'
import { useToast } from '../shared/Toast'

function BeatNode({ data }: { data: { label: string; labelColour: string; synopsis?: string } }) {
  return (
    <div
      className="relative rounded-[10px] border border-[var(--border)] min-w-[140px] max-w-[200px] cursor-pointer"
      style={{ background: 'var(--bg-card)' }}
    >
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

function beatsToNodes(beats: Beat[], savedPositions: Record<string, { x: number; y: number }>): Node[] {
  return beats.map((b, i) => {
    const saved = savedPositions[b.id]
    return {
      id: b.id,
      type: 'beatNode',
      position: saved ?? { x: (i % 4) * 260, y: Math.floor(i / 4) * 160 },
      data: { label: b.title || 'Untitled', labelColour: b.labelColour, synopsis: b.synopsis },
    }
  })
}

export function MindmapView({ outlineId }: { outlineId: string }) {
  const beats            = useBeats(outlineId)
  const setSelectedBeat  = useBoundStore(s => s.setSelectedBeat)
  const addBeat          = useBoundStore(s => s.addBeat)
  // Mindmap persistence
  const savedNodes       = useBoundStore(s => s.getMindmapNodes(outlineId))
  const savedEdges       = useBoundStore(s => s.getMindmapEdges(outlineId))
  const setMindmapNodes  = useBoundStore(s => s.setMindmapNodes)
  const setMindmapEdges  = useBoundStore(s => s.setMindmapEdges)
  const setViewport      = useBoundStore(s => s.setMindmapViewport)
  const { toast } = useToast()

  // Build saved positions map from persisted nodes
  const savedPositions: Record<string, { x: number; y: number }> = {}
  savedNodes.forEach(n => { savedPositions[n.id] = { x: n.x, y: n.y } })

  const initialNodes = beatsToNodes(beats, savedPositions)
  const initialEdges: Edge[] = savedEdges.map(e => ({
    ...e,
    animated: true,
    style: { stroke: 'var(--accent-teal)', strokeWidth: 2 },
  }))

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync new beats into nodes
  useEffect(() => {
    const existingIds = new Set(nodes.map(n => n.id))
    const newNodes = beats
      .filter(b => !existingIds.has(b.id))
      .map((b, i) => ({
        id: b.id, type: 'beatNode' as const,
        position: { x: (nodes.length + i) % 4 * 260, y: Math.floor((nodes.length + i) / 4) * 160 },
        data: { label: b.title || 'Untitled', labelColour: b.labelColour, synopsis: b.synopsis },
      }))
    if (newNodes.length) setNodes(ns => [...ns, ...newNodes])
  }, [beats])

  // Debounce-persist node positions without causing re-render loop
  const persistTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes)
    // Clear previous timer to debounce rapid drags
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      // Read directly from DOM state — don't call setNodes
      const flowNodes = document.querySelectorAll('.react-flow__node')
      const nodePositions: {id:string; x:number; y:number; data:Record<string,unknown>}[] = []
      flowNodes.forEach(el => {
        const transform = (el as HTMLElement).style.transform
        const match = transform.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/)
        if (match) {
          const id = el.getAttribute('data-id') || ''
          nodePositions.push({ id, x: parseFloat(match[1]), y: parseFloat(match[2]), data: {} })
        }
      })
      if (nodePositions.length) setMindmapNodes(outlineId, nodePositions)
    }, 600)
  }, [onNodesChange, outlineId, setMindmapNodes])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges(eds => {
        const next = addEdge({
          ...params, animated: true,
          style: { stroke: 'var(--accent-teal)', strokeWidth: 2 },
        }, eds)
        setMindmapEdges(outlineId, next.map(e => ({
          id: e.id, source: e.source, target: e.target, animated: true
        })))
        return next
      })
      toast('Connection created')
    },
    [setEdges, outlineId, setMindmapEdges, toast]
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
    toast('Beat added to mindmap')
  }, [outlineId, addBeat, setNodes, toast])

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    setMindmapNodes(outlineId, nodes.map(n => ({
      id: n.id, x: n.position.x, y: n.position.y, data: n.data as Record<string,unknown>
    })).map(n => n.id === node.id ? { ...n, x: node.position.x, y: node.position.y } : n))
  }, [nodes, outlineId, setMindmapNodes])

  return (
    <div className="flex-1 overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={handleNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDoubleClick={onDoubleClick}
        onMoveEnd={(_, vp) => setViewport(outlineId, vp)}
        nodeTypes={NODE_TYPES}
        fitView
        attributionPosition="bottom-left"
        style={{ background: 'var(--bg-primary)' }}
        defaultEdgeOptions={{ animated:true, style:{ stroke:'var(--accent-teal)', strokeWidth:2 } }}
        aria-label={`Mindmap for outline`}
      >
        <MiniMap
          style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)' }}
          nodeColor={() => 'var(--accent-teal)'}
          maskColor="rgba(13,38,38,0.7)"
          aria-label="Mindmap overview"
        />
        <Controls aria-label="Mindmap controls" />
        <Background variant={BackgroundVariant.Dots} color="var(--border)" gap={24} size={1} />
      </ReactFlow>
      {beats.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-[13px] text-[var(--text-muted)]">Double-click anywhere to add a node</p>
        </div>
      )}
    </div>
  )
}

export default MindmapView
