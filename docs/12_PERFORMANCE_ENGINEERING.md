# Performance Engineering

## 1. Objective

CPM must provide professional scheduling and project-controls workflows without UI stalls, runaway memory use, or unpredictable calculation time. Performance is a functional requirement and a release gate.

The product must optimize for:

- Fast startup and project open.
- Low-latency keyboard and pointer interaction.
- Deterministic high-throughput calculations.
- Efficient rendering of large tables, Gantt charts, networks, curves, and histograms.
- Bounded memory during import, export, snapshots, attachments, and undo/redo.
- Graceful cancellation and degradation under extreme workloads.

## 2. Benchmark hardware classes

Performance reports must state hardware, browser/runtime, power mode, dataset, and build.

### Class B1 — Minimum supported

- 4 logical CPU cores
- 8 GB RAM
- Integrated graphics
- Current supported Chromium, Firefox, or WebKit-based runtime
- Typical mid-range laptop or tablet

### Class B2 — Standard professional

- 8 logical CPU cores
- 16 GB RAM
- Modern integrated or entry discrete graphics
- Current stable Chromium-based desktop runtime

### Class B3 — High-end professional

- 12 or more logical CPU cores
- 32 GB RAM
- Modern discrete graphics where available

B2 is the primary release benchmark. B1 must remain usable within relaxed budgets. B3 is used for extreme scale and headroom analysis.

## 3. Standard benchmark datasets

Fixtures must be deterministic and committed or reproducibly generated.

| Profile | Activities | Relationships | BOQ items | Progress records | Resources | Attachments | Purpose |
|---|---:|---:|---:|---:|---:|---:|---|
| P0 Tiny | 100 | 250 | 100 | 1,000 | 50 | 10 | Unit and smoke tests |
| P1 Typical | 2,500 | 7,500 | 3,000 | 25,000 | 500 | 100 | Small-to-medium project |
| P2 Large | 10,000 | 35,000 | 15,000 | 150,000 | 2,000 | 500 | Large professional project |
| P3 Enterprise | 50,000 | 180,000 | 75,000 | 750,000 | 10,000 | 2,000 | Major program or imported enterprise schedule |
| P4 Extreme | 100,000 | 350,000 | 150,000 | 1,500,000 | 20,000 | 5,000 | Stress, read-only, and architecture ceiling tests |

The application must not render all rows or graph elements simultaneously. Large profiles require virtualization, level-of-detail rendering, progressive loading, and worker processing.

## 4. Hard interaction budgets

Measured on B2 unless stated otherwise.

| Operation | P1 target | P2 target | P3 target | Hard rule |
|---|---:|---:|---:|---|
| Warm application shell start | ≤ 700 ms p75 | same | same | Interactive shell appears before project data |
| Cold installed start | ≤ 2.5 s p75 | same | same | Includes service worker and essential assets |
| Open project to usable grid | ≤ 1.5 s p95 | ≤ 3.0 s p95 | ≤ 6.0 s p95 | Progressive data may continue loading |
| Single-cell edit acknowledgement | ≤ 50 ms p95 | ≤ 50 ms p95 | ≤ 75 ms p95 | UI feedback, not full recalculation |
| Keyboard grid navigation | ≤ 16 ms p95 frame work | same | same | No visible key lag during sustained navigation |
| Filter or sort visible result | ≤ 150 ms p95 | ≤ 300 ms p95 | ≤ 800 ms p95 | Cancel stale operations |
| Localized incremental recalc | ≤ 100 ms p95 | ≤ 250 ms p95 | ≤ 750 ms p95 | Where dependency cone permits |
| Full CPM recalculation | ≤ 250 ms p95 | ≤ 900 ms p95 | ≤ 3.5 s p95 | Includes validation and result serialization |
| S-curve/EVM regeneration | ≤ 300 ms p95 | ≤ 1.2 s p95 | ≤ 4.0 s p95 | For standard weekly periods |
| Gantt pan/scroll | 60 fps target | 60 fps target | ≥ 45 fps p95 | No full dataset re-render per frame |
| Grid scroll | 60 fps target | 60 fps target | ≥ 45 fps p95 | Virtualized rows and columns |
| Network first meaningful layout | ≤ 1.0 s | ≤ 3.0 s | ≤ 8.0 s | Progressive layout and path-first display |
| Autosave commit | ≤ 100 ms p95 | ≤ 200 ms p95 | ≤ 500 ms p95 | UI need not block; durability state visible |
| CSV import validation | ≥ 50k rows/s | ≥ 50k rows/s | ≥ 50k rows/s | Excludes user mapping time |
| `.cpmproj` export without large attachments | ≤ 2 s | ≤ 6 s | ≤ 20 s | Streamed, cancellable, bounded memory |
| Standard PDF report | ≤ 3 s | ≤ 8 s | ≤ 20 s | Progress and cancellation required above 3 s |

B1 may use twice the B2 time budgets but must preserve input responsiveness and cancellation.

## 5. Main-thread rules

- No non-user-blocking task may occupy the main thread for more than 50 ms.
- During active typing, dragging, scrolling, or zooming, p95 event-to-render latency must remain below 100 ms.
- Calculation, parsing, validation of large imports, network layout, report generation, compression, checksum calculation, and large serialization must run in workers or isolated processes.
- Work must be chunked and yield to the browser when worker use is unavailable.
- Stale worker results must be discarded by revision or operation token.
- Long-running operations must expose progress and cancellation.

## 6. Memory budgets

Measured as peak application memory on B2 with attachments not decoded unless viewed.

| Profile | Target steady memory | Hard peak budget |
|---|---:|---:|
| P1 | ≤ 250 MB | ≤ 400 MB |
| P2 | ≤ 500 MB | ≤ 800 MB |
| P3 | ≤ 1.0 GB | ≤ 1.5 GB |
| P4 | ≤ 1.6 GB | ≤ 2.2 GB |

Additional rules:

- Import and export must stream rather than create multiple complete in-memory copies.
- Attachments must be size-limited, lazily decoded, and thumbnail-first.
- Undo/redo stores commands or structural deltas, not full project snapshots per edit.
- Derived caches have explicit size limits and eviction.
- Worker transfer uses transferable buffers or structured sharing where safe.
- Charts retain aggregated series, not duplicate raw records.
- Memory must return near baseline after closing a large project and forcing normal garbage collection opportunities.

## 7. Rendering architecture

### 7.1 Activity and BOQ grids

- Virtualize rows and columns.
- Keep stable row identities and avoid remounting unchanged cells.
- Separate selection and viewport state from authoritative project data.
- Batch edits and validation notifications.
- Avoid per-cell global subscriptions.
- Render text input only for the actively edited cell where feasible.

### 7.2 Gantt

- Use viewport culling and level of detail.
- Separate static time grid, bars, labels, selections, and relationship layers.
- Aggregate or suppress non-driving relationship lines at low zoom.
- Cache calendar-to-pixel transforms by calendar revision and zoom.
- Preserve semantic hit targets without rendering every offscreen element.

### 7.3 Network diagram

- Layout in a worker.
- Support path-first, WBS-collapsed, selected-neighborhood, and full-network modes.
- Maintain spatial indexes for hit testing.
- Preserve manual positions independently of automatic layout output.
- For P3/P4, default to summarized or filtered views rather than an unreadable full graph.

### 7.4 Charts

- Aggregate raw records to visible period granularity before rendering.
- Downsample while preserving extrema and cumulative totals.
- Provide table alternatives from the same source series.
- Reuse scales and geometry when only styling or selection changes.

## 8. Calculation engine performance

- Use compact normalized arrays or typed structures for hot graph traversal paths.
- Build predecessor and successor adjacency indexes once per project revision.
- Topological ordering must be linear in activities plus relationships.
- Incremental recalculation should identify the affected dependency cone and reuse unaffected results.
- Calendar lookup should use indexed working intervals and cached next/previous working-time operations.
- Decimal calculations should avoid allocating temporary objects in inner loops.
- Warnings are collected through bounded structured buffers, not synchronous UI dispatches.
- Engine results are canonical and versioned, allowing safe cache reuse by input hash.

## 9. Storage performance

- Use indexed bulk transactions for imports and migrations.
- Separate authoritative tables from large derived indexes and view caches.
- Paginate and project only required fields for large lists.
- Avoid rewriting complete project documents for small edits.
- Compact command and audit history according to retention policy while preserving baselines and named snapshots.
- Detect storage quota before attachment import or large snapshot creation.
- Benchmark IndexedDB implementation differences across supported browsers.

## 10. Performance degradation policy

When a budget cannot be met:

1. Preserve correctness and data durability.
2. Preserve input responsiveness and cancellation.
3. Reduce visual detail or switch to summarized views.
4. Defer nonessential recalculation or rendering.
5. Explain the active limitation and recommended filter or hardware action.
6. Never silently omit authoritative records from exports or calculations.

## 11. Performance tests

| Test ID | Scenario | Pass condition |
|---|---|---|
| PT-001 | Cold and warm startup on B1/B2 | Meets startup budgets and opens offline |
| PT-002 | Open P1-P4 projects | Meets usable-grid budgets and remains cancellable |
| PT-003 | Sustained grid navigation and editing | No key loss; latency and frame budgets pass |
| PT-004 | Full and incremental CPM calculation | Correct output and profile budgets pass |
| PT-005 | Repeated rapid edits | Stale jobs never commit; no worker buildup |
| PT-006 | Gantt pan, zoom, filter, and relationship display | Frame and interaction budgets pass |
| PT-007 | Network path isolation and layout | First meaningful layout and cancellation budgets pass |
| PT-008 | S-curve, EVM, and histogram regeneration | Calculation and chart budgets pass |
| PT-009 | CSV/XLSX import and mapping preview | Throughput and memory budgets pass |
| PT-010 | `.cpmproj` export/import with checksums | Time, memory, integrity, and cancellation pass |
| PT-011 | PDF report generation | Time, memory, pagination, and progress pass |
| PT-012 | Autosave under continuous editing | Durability budget passes without interaction regression |
| PT-013 | Open/close P3 project repeatedly | No unbounded memory growth or retained workers |
| PT-014 | Attachment thumbnail and preview corpus | Decode limits and memory recovery pass |
| PT-015 | Browser storage under quota pressure | Graceful warning and atomic failure without data loss |
| PT-016 | 30-minute professional workflow soak | No progressive latency, memory, or error-rate degradation |
| PT-017 | Reduced-power mode on B1 | Core editing remains responsive under relaxed budgets |
| PT-018 | Accessibility tools active | Screen-reader and zoom do not cause severe performance regression |
| PT-019 | Regression comparison with previous release | No metric exceeds allowed regression without approved exception |
| PT-020 | P4 extreme stress | Product remains recoverable, cancellable, and honest even where target times are exceeded |

## 12. Regression policy

- A release fails when a hard budget is exceeded by more than 10% in three stable runs.
- A p95 metric regressing more than 15% from the last approved release requires investigation and approval even if still under budget.
- Performance exceptions require an issue, root cause, affected profiles, mitigation, expiration release, and product-owner approval.
- Benchmark results and traces are retained as release artifacts.

## 13. Profiling and diagnostics

Development builds must support:

- User timing marks around project open, transactions, calculations, layouts, charts, import, export, and migration.
- Worker queue depth and cancellation counters.
- Long-task reporting.
- Render-count diagnostics for major views.
- Database transaction duration and row counts.
- Memory snapshots and retained-object investigation procedures.
- Canonical benchmark command producing machine-readable JSON and human-readable reports.

Diagnostics must be disabled or privacy-safe by default in production and must never upload project content without explicit user action.

## 14. Acceptance

A visually polished feature that violates interaction, calculation, memory, or startup budgets is not complete. Performance evidence must be reviewed in the same pull request as any change affecting hot paths, data volume, rendering, workers, storage, imports, exports, or calculations.