import { useState } from 'react';
import type { WbsNode } from '../domain/project/types';

interface WbsPanelProps {
  nodes: WbsNode[];
  onAdd: (node: WbsNode) => void;
}

export function WbsPanel({ nodes, onAdd }: WbsPanelProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(nodes[0]?.id ?? '');

  return (
    <section className="surface panel-stack" aria-labelledby="wbs-panel-title">
      <div className="surface-heading">
        <div>
          <p className="eyebrow">Scope hierarchy</p>
          <h2 id="wbs-panel-title">Work breakdown structure</h2>
        </div>
      </div>
      <ul className="wbs-list">
        {[...nodes].sort((left, right) => left.code.localeCompare(right.code)).map((node) => (
          <li key={node.id}><strong>{node.code}</strong><span>{node.name}</span></li>
        ))}
      </ul>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!code.trim() || !name.trim()) return;
          onAdd({ id: crypto.randomUUID(), code: code.trim(), name: name.trim(), parentId: parentId || undefined, sortOrder: nodes.length });
          setCode('');
          setName('');
        }}
      >
        <label>Code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="1.3" /></label>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Finishes" /></label>
        <label>Parent<select value={parentId} onChange={(event) => setParentId(event.target.value)}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.code}</option>)}</select></label>
        <button className="button button-primary" type="submit">Add WBS</button>
      </form>
    </section>
  );
}
