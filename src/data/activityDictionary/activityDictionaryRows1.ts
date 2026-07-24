export const ACTIVITY_DICTIONARY_ROWS_1 = `
PRE-001|Preconstruction & permits|Project feasibility and site due diligence|report|0.25|0.15|0.5|Project manager + design leads|Office tools|One consolidated feasibility report
PRE-002|Preconstruction & permits|Land title and technical document verification|lot|0.5|0.25|1.0|Document controller + liaison|Office tools|Complete owner-provided records
PRE-003|Preconstruction & permits|Barangay clearance preparation and filing|submission|1.0|0.5|2.0|Permit liaison|Transport + office tools|Excludes agency review time
PRE-004|Preconstruction & permits|Locational clearance / zoning application|submission|0.5|0.25|1.0|Permit liaison + architect|Office tools|Preparation and filing only
PRE-005|Preconstruction & permits|Building permit drawing and document consolidation|permit set|0.2|0.1|0.33|Architect + engineers + document controller|CAD/BIM + office tools|Complete coordinated permit set
PRE-006|Preconstruction & permits|Building permit application filing|submission|1.0|0.5|2.0|Permit liaison|Transport + office tools|Excludes LGU processing time
PRE-007|Preconstruction & permits|BFP fire safety evaluation clearance preparation|submission|0.5|0.25|1.0|Fire protection engineer + liaison|CAD/BIM + office tools|Document preparation and filing
PRE-008|Preconstruction & permits|DENR environmental compliance screening|report|0.25|0.1|0.5|Environmental specialist|Office tools|Screening and initial documentation
PRE-009|Preconstruction & permits|ECC/CNC application package preparation|submission|0.2|0.1|0.33|Environmental specialist + liaison|Office tools|Excludes regulatory review
PRE-010|Preconstruction & permits|DOLE construction safety and health program preparation|submission|0.5|0.25|1.0|Safety officer + project manager|Office tools|Project-specific CSHP
PRE-011|Preconstruction & permits|Temporary utility application preparation|application|1.0|0.5|2.0|Site engineer + liaison|Office tools|Power or water application
PRE-012|Preconstruction & permits|Traffic management plan preparation|plan|0.33|0.2|0.5|Traffic engineer + safety officer|CAD + office tools|Urban work-zone plan
PRE-013|Preconstruction & permits|Excavation permit / road opening permit preparation|submission|0.5|0.25|1.0|Civil engineer + liaison|Office tools|Per road-opening package
PRE-014|Preconstruction & permits|Preconstruction coordination meeting|meeting|1.0|1.0|2.0|Project team|Meeting facilities|One formal coordination meeting
PRE-015|Preconstruction & permits|Notice to proceed and contract document mobilization|package|1.0|0.5|2.0|Project manager + document controller|Office tools|Internal contract mobilization
SUR-001|Survey & investigation|Reconnaissance survey|hectare|2.0|1.0|4.0|Survey crew|GNSS + total station|Accessible site
SUR-002|Survey & investigation|Topographic survey|hectare|1.0|0.5|2.0|Surveyor + 2 aides|Total station + GNSS|Moderate terrain and detail
SUR-003|Survey & investigation|Property boundary relocation survey|corner|6.0|3.0|10.0|Geodetic engineer crew|Total station + GNSS|Recoverable monuments
SUR-004|Survey & investigation|Construction control points establishment|point|8.0|4.0|12.0|Survey crew|Total station + level|Includes monumenting
SUR-005|Survey & investigation|Utility detection and mapping|linear m|150.0|75.0|300.0|Survey crew + utility locator|Utility locator + GPR|Normal urban congestion
SUR-006|Survey & investigation|Geotechnical borehole drilling|linear m|12.0|6.0|20.0|Drilling crew|Rotary drilling rig|Soil profile without hard rock
SUR-007|Survey & investigation|Standard penetration testing|test|12.0|6.0|18.0|Geotechnical drilling crew|SPT equipment|Performed with borehole
SUR-008|Survey & investigation|Test pit excavation and logging|pit|2.0|1.0|4.0|Backhoe crew + geologist|Backhoe|Typical 2–3 m pit
SUR-009|Survey & investigation|Soil sample laboratory classification|sample|12.0|6.0|24.0|Laboratory technician|Soil lab equipment|Moisture, gradation, Atterberg
SUR-010|Survey & investigation|Soil compaction test / Proctor|sample|4.0|2.0|6.0|Laboratory technician|Compaction apparatus|Standard or modified Proctor
SUR-011|Survey & investigation|California bearing ratio test|sample|2.0|1.0|3.0|Laboratory technician|CBR apparatus|Excludes soaking elapsed time
SUR-012|Survey & investigation|Plate load test|test|1.0|0.5|2.0|Geotechnical crew|Reaction frame + gauges|Prepared test area
SUR-013|Survey & investigation|Field density test|test|12.0|8.0|20.0|QA technician|Sand cone or nuclear gauge|Accessible compacted layer
SUR-014|Survey & investigation|Concrete core drilling and testing|core|6.0|3.0|10.0|Testing crew|Core drill + compression machine|Normal slab/wall access
SUR-015|Survey & investigation|Geotechnical investigation report|report|0.2|0.1|0.33|Geotechnical engineer|Analysis software|Complete field and lab results
SUR-016|Survey & investigation|Hydrologic and drainage field assessment|hectare|1.0|0.5|2.0|Civil engineer + survey crew|Survey equipment|Normal access
MOB-001|Mobilization & temporary works|Project mobilization|lot|0.2|0.1|0.33|Project management team|Transport fleet|Medium building project
MOB-002|Mobilization & temporary works|Temporary site fencing installation|linear m|40.0|20.0|70.0|Carpenter/welder crew|Hand tools + welding set|GI sheet or plywood hoarding
MOB-003|Mobilization & temporary works|Project billboard installation|unit|2.0|1.0|3.0|Carpenter crew|Hand tools|Standard project sign
MOB-004|Mobilization & temporary works|Temporary site office installation|m2|20.0|10.0|35.0|Carpenter/electrician crew|Hand tools|Lightweight modular construction
MOB-005|Mobilization & temporary works|Temporary worker facilities installation|m2|18.0|8.0|30.0|Carpenter/plumber crew|Hand tools|Toilets, wash and rest areas
MOB-006|Mobilization & temporary works|Temporary power distribution installation|point|8.0|4.0|12.0|Electrician crew|Electrical tools|Temporary panels and outlets
MOB-007|Mobilization & temporary works|Temporary water distribution installation|linear m|60.0|30.0|100.0|Plumber crew|Pipe tools|Surface-laid temporary piping
MOB-008|Mobilization & temporary works|Site clearing and grubbing|hectare|0.35|0.15|0.6|Equipment crew + laborers|Bulldozer + chainsaw|Light to moderate vegetation
MOB-009|Mobilization & temporary works|Tree cutting and disposal|tree|8.0|3.0|15.0|Tree-cutting crew|Chainsaw + truck|Medium trees with permit
MOB-010|Mobilization & temporary works|Temporary access road construction|m2|250.0|120.0|450.0|Earthworks crew|Grader + roller + trucks|Gravel access road
MOB-011|Mobilization & temporary works|Erosion and sediment control installation|linear m|80.0|40.0|140.0|Civil crew|Hand tools|Silt fence/check controls
MOB-012|Mobilization & temporary works|Scaffolding erection|m2|80.0|40.0|140.0|Certified scaffold crew|System scaffold|Measured by face area
MOB-013|Mobilization & temporary works|Scaffolding dismantling|m2|120.0|70.0|200.0|Certified scaffold crew|System scaffold|Normal dismantling access
MOB-014|Mobilization & temporary works|Temporary shoring installation|m2|25.0|12.0|45.0|Shoring crew|Shoring system + crane|Engineered shoring
MOB-015|Mobilization & temporary works|Dewatering system installation|wellpoint|10.0|5.0|16.0|Dewatering crew|Pumps + wellpoint equipment|Standard wellpoint setup
DEM-001|Demolition & renovation|Manual demolition of masonry partitions|m2|25.0|12.0|45.0|4 laborers|Demolition tools|Non-load-bearing wall
DEM-002|Demolition & renovation|Mechanical demolition of concrete|m3|8.0|3.0|15.0|Equipment crew|Excavator + breaker|Accessible reinforced concrete
DEM-003|Demolition & renovation|Removal of floor finishes|m2|45.0|20.0|80.0|4 laborers|Chipping tools|Tiles or thin screed
DEM-004|Demolition & renovation|Removal of ceiling system|m2|80.0|40.0|140.0|3 laborers|Hand tools + scaffold|Suspended ceiling
DEM-005|Demolition & renovation|Removal of roofing sheets|m2|100.0|50.0|160.0|Roofing crew|Safety lines + hand tools|Reusable or scrap removal
DEM-006|Demolition & renovation|Removal of doors and windows|unit|20.0|10.0|35.0|Carpenter crew|Hand tools|Careful removal
DEM-007|Demolition & renovation|Demolition debris loading and hauling|m3|35.0|18.0|60.0|Equipment + trucking crew|Loader + dump trucks|Disposal site available
EAR-001|Earthworks & site development|Bulk excavation in common soil|m3|180.0|90.0|320.0|Excavator + trucks crew|Excavator + dump trucks|Normal haul and access
EAR-002|Earthworks & site development|Rock excavation with hydraulic breaker|m3|25.0|10.0|50.0|Excavator crew|Excavator + breaker|Weathered to medium rock
EAR-003|Earthworks & site development|Manual excavation for footings|m3|8.0|4.0|14.0|4 laborers|Hand tools|Shallow excavation
EAR-004|Earthworks & site development|Trench excavation by backhoe|m3|100.0|50.0|180.0|Backhoe crew|Backhoe + trucks|Utility trench
EAR-005|Earthworks & site development|Selected fill placement|m3|120.0|60.0|220.0|Earthworks crew|Loader + trucks + roller|Measured compacted volume
EAR-006|Earthworks & site development|Embankment spreading and compaction|m3|300.0|150.0|500.0|Earthworks crew|Dozer + grader + roller|200 mm compacted lifts
EAR-007|Earthworks & site development|Backfilling around structures|m3|45.0|20.0|80.0|Backhoe + labor crew|Backhoe + plate compactor|Restricted working area
EAR-008|Earthworks & site development|Granular bedding placement|m3|35.0|18.0|60.0|Civil crew|Plate compactor|Utility bedding
`;
