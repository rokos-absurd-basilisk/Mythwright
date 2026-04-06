import { useCallback, useEffect, useRef } from 'react'
import React from 'react'
import {
  ReactFlow, addEdge, MiniMap, Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState,
  type Edge, type Connection, type NodeTypes,
} from '@xyflow/react'
import type { Node as FlowNode } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBoundStore, useBeats } from '../../store'
import { useShallow } from 'zustand/shallow'
import { type Beat } from '../../types'
import { useToast } from '../shared/Toast'

function BeatNode({ data }: { data: { label: string; labelColour: string; synopsis?: string } }) {
  return (
    <div className="relative rounded-[10px] border border-[var(--border)] min-w-[140px] max-w-[200px] cursor-pointer"
      style={{ background: 'var(--bg-card)' }}>
      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ background: data.labelColour || 'var(--accent-teal)' }}/>
      <div className="px-3 py-2 pl-4">
        <p className="font-[family-name:var(--font-heading)] font-semibold text-[12px] text-[var(--text-primary)] uppercase tracking-wide leading-snug">
          {data.label}
        </p>
        {data.synopsis && (
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
            {data.synopsis}
          </p>
        )}
      </div>
    </div>
  )
}

const NODE_TYPES: NodeTypes = { beatNode: BeatNode as never }

function beatsToNodes(beats: Beat[], savedMap: Record<string, { x: number; y: number }>): FlowNode[] {
  return beats.map((b, i) => {
    const saved = savedMap[b.id]
    return {
      id: b.id, type: 'beatNode' as const,
      position: saved ?? { x: (i % 4) * 260, y: Math.floor(i / 4) * 160 },
      data: { label: b.title || 'Untitled', labelColour: b.labelColour, synopsis: b.synopsis },
    }
  })
}

export function MindmapView({ outlineId }: { outlineId: string }) {
  const beats           = useBeats(outlineId)
  const setSelectedBeat = useBoundStore(s => s.setSelectedBeat)
  const addBeat         = useBoundStore(s => s.addBeat)
  // Stable shallow selectors — prevent getSnapshot instability
  const savedNodes = useBoundStore(useShallow(s => s.mindmapNodes[outlineId] ?? []))
  const savedEdges = useBoundStore(useShallow(s => s.mindmapEdges[outlineId] ?? []))
  const setMindmapNodes = useBoundStore(s => s.setMindmapNodes)
  const setMindmapEdges = useBoundStore(s => s.setMindmapEdges)
  const setViewport     = useBoundStore(s => s.setMindmapViewport)
  const { toast }       = useToast()

  const savedPosMap = React.useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {}
    savedNodes.forEach(n => { m[n.id] = { x: n.x, y: n.y } })
    return m
  }, [savedNodes])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialNodes = React.useMemo(() => beatsToNodes(beats, savedPosMap), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialEdges: Edge[] = React.useMemo(() => savedEdges.map(e => ({
    ...e, animated: true,
    style: { stroke: 'var(--accent-teal)', strokeWidth: 2 },
  })), [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Track previous beat count to avoid re-running on unrelated renders
  const prevBeatCount = useRef(beats.length)

  // Add new beats that appear after mount — only when beat COUNT increases
  useEffect(() => {
    if (beats.length <= prevBeatCount.current) {
      prevBeatCount.current = beats.length
      return
    }
    prevBeatCount.current = beats.length

    setNodes(current => {
      const existingIds = new Set(current.map(n => n.id))
      const newNodes = beats
        .filter(b => !existingIds.has(b.id))
        .map((b, i) => ({
          id: b.id, type: 'beatNode' as const,
          position: { x: (current.length + i) % 4 * 260, y: Math.floor((current.length + i) / 4) * 160 },
          data: { label: b.title || 'Untitled', labelColour: b.labelColour, synopsis: b.synopsis },
        }))
      return newNodes.length > 0 ? [...current, ...newNodes] : current
    })
  }, [beats.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist node positions on drag stop (avoids setState-in-render loop)
  const onNodeDragStop = useCallback((_: React.MouseEvent, node: FlowNode) => {
    setNodes(ns => {
      const updated = ns.map(n => n.id === node.id ? { ...n, position: node.position } : n)
      setMindmapNodes(outlineId, updated.map(n => ({
        id: n.id, x: n.position.x, y: n.position.y, data: n.data as Record<string, unknown>,
      })))
      return updated
    })
  }, [outlineId, setMindmapNodes, setNodes])

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => {
      const next = addEdge({
        ...params, animated: true,
        style: { stroke: 'var(--accent-teal)', strokeWidth: 2 },
      }, eds)
      setMindmapEdges(outlineId, next.map(e => ({
        id: e.id, source: e.source, target: e.target, animated: true,
      })))
      return next
    })
    toast('Connection created')
  }, [setEdges, outlineId, setMindmapEdges, toast])

  const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
    setSelectedBeat(node.id)
  }, [setSelectedBeat])

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.react-flow__node')) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const beat = addBeat(outlineId, 'New Beat', {})
    setNodes(ns => [...ns, {
      id: beat.id, type: 'beatNode' as const,
      position: { x: e.clientX - rect.left - 70, y: e.clientY - rect.top - 30 },
      data: { label: beat.title, labelColour: beat.labelColour, synopsis: '' },
    }])
    toast('Beat added to mindmap')
  }, [outlineId, addBeat, setNodes, toast])

  return (
    <div className="flex-1 overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDoubleClick={onDoubleClick}
        onMoveEnd={(_, vp) => setViewport(outlineId, vp)}
        nodeTypes={NODE_TYPES}
        fitView
        attributionPosition="bottom-left"
        style={{ background: 'var(--bg-primary)' }}
        defaultEdgeOptions={{ animated: true, style: { stroke: 'var(--accent-teal)', strokeWidth: 2 } }}
        aria-label="Mindmap for outline"
      >
        <MiniMap
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          nodeColor={() => 'var(--accent-teal)'}
          maskColor="rgba(13,38,38,0.7)"
          aria-label="Mindmap overview"
        />
        <Controls aria-label="Mindmap controls"/>
        <Background variant={BackgroundVariant.Dots} color="var(--border)" gap={24} size={1}/>
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
