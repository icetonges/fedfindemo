export type KnowledgeReference = {
  label: string;
  href: string;
  note: string;
};

export type KnowledgeSection = {
  title: string;
  body: string;
  bullets: string[];
};

export type KnowledgePlaybook = {
  page: string;
  eyebrow: string;
  title: string;
  summary: string;
  references: KnowledgeReference[];
  sections: KnowledgeSection[];
};

const commonReferences = {
  a11: {
    label: "OMB Circular A-11",
    href: "https://bidenwhitehouse.archives.gov/omb/information-for-agencies/circulars/",
    note: "Preparation, submission, and execution of the budget."
  },
  a123: {
    label: "OMB Circular A-123",
    href: "https://trumpwhitehouse.archives.gov/sites/whitehouse.gov/files/omb/memoranda/2016/m-16-17.pdf",
    note: "Enterprise risk management and internal control."
  },
  fmr: {
    label: "DoD FMR 7000.14-R",
    href: "https://comptroller.defense.gov/FMR/",
    note: "DoD financial management regulation by volume and chapter."
  },
  budgetMaterials: {
    label: "DoD Budget Materials",
    href: "https://comptroller.defense.gov/Budget-Materials/",
    note: "FY budget request overview, justification books, and exhibit files."
  },
  greenBook: {
    label: "GAO Green Book",
    href: "https://www.gao.gov/products/gao-14-704g",
    note: "Standards for internal control in the federal government."
  },
  yellowBook: {
    label: "GAO Yellow Book",
    href: "https://www.gao.gov/yellowbook",
    note: "Government auditing standards for financial, attestation, and performance audits."
  },
  ussgl: {
    label: "Treasury USSGL",
    href: "https://www.fiscal.treasury.gov/ussgl/",
    note: "Uniform chart of accounts and accounting scenarios."
  },
  dataTransparency: {
    label: "Treasury Data Transparency",
    href: "https://fiscal.treasury.gov/data-transparency/DAIMS-current.html",
    note: "Governmentwide spending data model, Data Broker, and USAspending publication path."
  },
  usaspending: {
    label: "USAspending Data Dictionary",
    href: "https://www.usaspending.gov/data-dictionary",
    note: "Award and federal spending data element definitions."
  }
};

export const knowledgePlaybooks: Record<string, KnowledgePlaybook> = {
  dashboard: {
    page: "dashboard",
    eyebrow: "DoD Prototype Knowledge Layer",
    title: "Executive operating model for budget, audit, and financial operations.",
    summary: "Use the dashboard as the command layer that ties OMB budget policy, DoD FMR execution/accounting rules, GAO control standards, Treasury accounting/data standards, and local DoD source files into one operating picture.",
    references: [commonReferences.a11, commonReferences.fmr, commonReferences.a123, commonReferences.greenBook, commonReferences.dataTransparency],
    sections: [
      {
        title: "Policy architecture to show on the executive dashboard",
        body: "The dashboard should explain where each signal belongs in the federal finance lifecycle: formulation, enactment, apportionment, allotment, obligation, outlay, accounting, reporting, audit, and remediation.",
        bullets: [
          "Budget formulation: OMB A-11 plus DoD budget justification books define request structure, exhibits, object classes, program lines, and congressional submission context.",
          "Budget execution: OMB A-11 execution rules and DoD FMR Volume 3 connect apportionment, allotments, commitments, obligations, expenditure controls, and Antideficiency Act exposure.",
          "Accounting and reporting: USSGL, Treasury Financial Manual, and DoD FMR Volumes 4, 6A, and 6B define posting logic, financial statements, and reconciliations.",
          "Risk and control: OMB A-123 and the GAO Green Book define enterprise risk, entity-level controls, control activities, information/communication, monitoring, deficiencies, and assurance statements.",
          "Audit and oversight: GAO Yellow Book, DoD Agency Financial Reports, DoD IG findings, and corrective action plans should feed audit-readiness status and evidence aging."
        ]
      },
      {
        title: "How analysts should use the dashboard",
        body: "Start with the KPI drilldowns, then move through evidence source, chart slice, and model workbench in that order.",
        bullets: [
          "Open a KPI drilldown to confirm source lineage before interpreting the number.",
          "Filter budget charts by fiscal year, source exhibit, appropriation family, account, activity, and scenario.",
          "Filter award charts by source file, award type, month, agency, recipient, and place of performance.",
          "Review mission-control action queue before AI analysis; AI prompts should cite the same finding, anomaly, or budget variance record.",
          "Treat every dashboard number as a traceable analytic product: source path, parser status, generated timestamp, applied filter, and recommended action."
        ]
      }
    ]
  },
  budget: {
    page: "budget",
    eyebrow: "Budget Formulation And Execution Research",
    title: "OMB A-11, DoD budget exhibits, and DoD FMR budget execution mapped to working instructions.",
    summary: "The Budget Lab should operate as a research-backed workbench for DoD request analysis, account variance, exhibit interpretation, budget-book review, and execution-risk monitoring.",
    references: [commonReferences.a11, commonReferences.budgetMaterials, commonReferences.fmr, commonReferences.ussgl],
    sections: [
      {
        title: "Core document breakdown",
        body: "OMB A-11 is the primary governmentwide budget instruction; DoD budget materials provide the DoD-specific request books and exhibits; DoD FMR turns enacted resources into execution controls.",
        bullets: [
          "OMB A-11 Part 1: general budget submission requirements, schedule, transmittals, and responsibilities.",
          "OMB A-11 Part 2: budget formulation and presentation, including MAX schedules, account structure, object classification, baseline, and supporting materials.",
          "OMB A-11 Part 3: selected budget actions, supplementals, rescissions, deferrals, and special analyses.",
          "OMB A-11 Part 4: budget execution, apportionments, reapportionments, deferrals, reporting, and control of obligations.",
          "OMB A-11 Part 5: federal credit, financing accounts, liquidating accounts, cohorts, subsidy cost, and credit reestimates.",
          "OMB A-11 Part 6: federal performance framework connecting budget resources to goals, indicators, strategic objectives, and annual performance plans.",
          "OMB A-11 Part 7: capital programming and planning, including acquisition, IT, business case, and major capital asset discipline.",
          "DoD Budget Materials: overview books, M-1, O-1, RF-1, P-1, P-1R, R-1, C-1, Pacific Deterrence Initiative, and JSON/Excel exhibits.",
          "DoD FMR Volume 2A/2B/2C: budget formulation and presentation for appropriations, budget activities, military personnel, O&M, procurement, RDT&E, construction, revolving funds, and supporting exhibits.",
          "DoD FMR Volume 3: budget execution, obligation controls, apportionment/allotment mechanics, expired/cancelled accounts, adjustments, and ADA-sensitive areas."
        ]
      },
      {
        title: "Budget analyst work instruction",
        body: "Use this workflow when reviewing a DoD budget file, budget exhibit, or request variance.",
        bullets: [
          "Step 1: Identify appropriation family, account title, budget activity, program element or line item, fiscal year, and scenario.",
          "Step 2: Map each line to OMB A-11 budget concepts: account, object class, budget authority, obligations, outlays, baseline, and performance linkage.",
          "Step 3: Compare FY2026 to FY2027 values and separate program growth, inflation, transfer, reclassification, new start, termination, and execution carryover.",
          "Step 4: Tie large variances to DoD exhibit evidence: M-1 for military personnel, O-1/OP exhibits for O&M, P-1 for procurement, R-1/R-2 for RDT&E, C-1 for construction.",
          "Step 5: Flag execution risks: obligation phasing, expired-year usage, reprogramming dependency, negative adjustments, ADA risk, and missing spend-plan justification.",
          "Step 6: Create a narrative output with source path, exhibit, line, fiscal years compared, dollar delta, percent delta, policy basis, and recommended analyst action."
        ]
      },
      {
        title: "DoD FMR volume map for budget pages",
        body: "Use these volumes as the first content taxonomy for DoD prototype expansion.",
        bullets: [
          "Volume 1: general financial management information, definitions, roles, responsibilities, and foundational policy.",
          "Volume 2A/2B/2C: budget formulation and presentation, appropriation-specific exhibits, and justification book structure.",
          "Volume 3: budget execution, including apportionment, allotment, commitments, obligations, expired accounts, and ADA control.",
          "Volume 4: accounting policy and USSGL-oriented treatment of assets, liabilities, budgetary accounting, and proprietary accounting.",
          "Volume 6A/6B: financial reporting policy, external reports, audited financial statement form and content.",
          "Volume 14: Antideficiency Act policy, investigation, reporting, and prevention controls.",
          "Volume 15: security assistance policy for foreign military sales and related trust/accounting treatment.",
          "Volume 16: DoD debt management, collections, receivables, and write-off policy."
        ]
      }
    ]
  },
  audit: {
    page: "audit",
    eyebrow: "Audit Readiness Research",
    title: "OMB A-123, GAO Green Book, Yellow Book, DoD AFR, and corrective action playbook.",
    summary: "The Audit Readiness page should teach how to move from finding language to control design, evidence, testing, remediation, and management assurance.",
    references: [commonReferences.a123, commonReferences.greenBook, commonReferences.yellowBook, commonReferences.fmr],
    sections: [
      {
        title: "Control and audit standards map",
        body: "Audit readiness is not only a PDF parsing problem; it is a control-operating model problem.",
        bullets: [
          "OMB A-123 defines management responsibility for ERM and internal control, including annual assessments and assurance reporting.",
          "GAO Green Book defines the federal internal control framework: control environment, risk assessment, control activities, information and communication, and monitoring.",
          "GAO Yellow Book defines standards for government auditing, including financial audits, attestation engagements, performance audits, auditor independence, quality management, and reporting.",
          "DoD FMR Volume 6B provides financial statement form and content context for AFR interpretation.",
          "DoD FMR Volume 14 should be linked whenever findings touch obligation control, funds control, or potential Antideficiency Act exposure."
        ]
      },
      {
        title: "Finding-to-control work instruction",
        body: "Use this method to convert audit documents into an operational readiness register.",
        bullets: [
          "Extract finding title, condition, criteria, cause, effect, recommendation, management response, target completion date, and responsible office.",
          "Map criteria to A-123, Green Book principle, DoD FMR volume/chapter, USSGL, or DoD policy citation.",
          "Create control objective, control activity, control owner, frequency, evidence artifact, system of record, and test procedure.",
          "Classify risk as material weakness, significant deficiency, control deficiency, compliance issue, data quality issue, or process maturity issue.",
          "Score evidence sufficiency by completeness, accuracy, timeliness, source authority, retrievability, and repeatability.",
          "Track remediation as root cause, corrective action plan, milestone, validation evidence, retest date, and closure package."
        ]
      },
      {
        title: "DoD prototype audit content to add",
        body: "These are the research-backed modules that should sit under the audit page over time.",
        bullets: [
          "AFR reader: parse management discussion, auditor opinion, material weaknesses, financial statement notes, and required supplementary information.",
          "Control matrix: Green Book principle to DoD process mapping for budgetary resources, Fund Balance with Treasury, property, inventory, accounts payable, and systems.",
          "Evidence binder: source path, document page, snippet, control owner, test attribute, and audit request linkage.",
          "Corrective action tracker: due date, status, aging, risk, dependency, validation evidence, and retest result.",
          "Audit standards explainer: Yellow Book independence, competence, quality management, evidence, reporting, and performance audit criteria."
        ]
      }
    ]
  },
  finops: {
    page: "finops",
    eyebrow: "Financial Operations Research",
    title: "USAspending, Treasury transparency, USSGL, FAR/DFARS context, and award-monitoring work instructions.",
    summary: "The FinOps Monitor should connect award actions to obligation risk, recipient concentration, object class, agency portfolio, and accounting/reporting consequences.",
    references: [commonReferences.usaspending, commonReferences.dataTransparency, commonReferences.ussgl, commonReferences.fmr],
    sections: [
      {
        title: "Operational data model",
        body: "Financial operations should join award-level data with budget authority, obligations, outlays, accounting events, recipient metadata, and source lineage.",
        bullets: [
          "USAspending provides award and transaction fields for contracts, assistance, recipients, agencies, NAICS, PSC/object class, geography, dates, and obligation values.",
          "Treasury Data Transparency links agency submissions, Governmentwide Spending Data Model terms, Data Broker validations, and USAspending publication.",
          "USSGL provides account posting and scenario discipline for obligations, disbursements, receivables, advances, accruals, and budgetary/proprietary crosswalks.",
          "DoD FMR Volume 3 is the funds-control anchor; Volume 10 is critical for contract payment policy; Volume 11 supports reimbursable activity; Volume 16 supports debt/receivable management."
        ]
      },
      {
        title: "FinOps analyst work instruction",
        body: "Use this workflow for award and obligation monitoring.",
        bullets: [
          "Step 1: Filter by fiscal year, agency/subagency, award type, recipient, object class, NAICS/PSC, and source extract.",
          "Step 2: Separate prime awards, subawards, contract actions, assistance actions, negative obligations, and missing-recipient rows.",
          "Step 3: Compute concentration by recipient, office, program, geography, month, and obligation size.",
          "Step 4: Flag operational exceptions: negative obligation, unusually large action, missing recipient, stale source, unusual state/recipient mismatch, and object-class concentration.",
          "Step 5: Tie each exception to the budget execution control it could affect: obligation validity, recording timeliness, upward/downward adjustment, expired-year use, closeout, or payment status.",
          "Step 6: Produce an action queue for review, documentation request, vendor/recipient enrichment, and reconciliation."
        ]
      },
      {
        title: "Procedure and policy expansion list",
        body: "Use these topics as the content backlog for a DoD FinOps prototype.",
        bullets: [
          "Obligation lifecycle: commitment, obligation, expenditure, disbursement, accrual, adjustment, deobligation, closeout.",
          "Contract payment: invoice receipt, acceptance, prompt payment, improper payment risk, discounts, interest, and payment holds.",
          "Reconciliation: award system to accounting system to Treasury/GTAS to USAspending published data.",
          "Recipient risk: concentration, exclusions, identifier quality, geography, assistance/contract mix, and subcontractor visibility.",
          "Data quality: DATA Act broker rules, award ID completeness, recipient name standardization, agency code mapping, and source-file lineage."
        ]
      }
    ]
  },
  ai: {
    page: "ai",
    eyebrow: "AI Analyst Research Layer",
    title: "Federal finance AI assistant design: evidence grounding, model comparison, controls, and human review.",
    summary: "The AI Analyst page should behave like a governed analytic workbench: models compare outputs, cite source context, expose assumptions, and produce analyst-ready decision support.",
    references: [commonReferences.a123, commonReferences.greenBook, commonReferences.dataTransparency, commonReferences.fmr],
    sections: [
      {
        title: "AI use cases by page",
        body: "Each AI mode should have a bounded task, source bundle, output schema, and review workflow.",
        bullets: [
          "Budget analyst: explain FY deltas, appropriation movement, exhibit-level evidence, and reprogramming/execution risks.",
          "Audit readiness: map findings to Green Book principles, A-123 requirements, evidence artifacts, and corrective action plans.",
          "Anomaly triage: summarize negative actions, recipient concentration, missing metadata, and source-quality issues.",
          "Document intelligence: summarize budget books, extract tables, create page-linked snippets, and identify policy citations.",
          "Data quality: assess source coverage, schema drift, parser status, missing fields, and cloud-ingestion readiness.",
          "Executive briefer: produce decision memo, risk heatmap, open questions, and next-action sequence."
        ]
      },
      {
        title: "Model governance requirements",
        body: "Treat model outputs as decision support, not authoritative accounting records.",
        bullets: [
          "Store prompt, profile, model, provider, source snapshot signature, generated time, user-selected filters, and output.",
          "Separate local deterministic analysis from external LLM responses when API keys are configured.",
          "Require citations to source paths or official policy references for every material claim.",
          "Use side-by-side comparison to identify disagreement, missing evidence, hallucination risk, and confidence gaps.",
          "Route production recommendations through human review, audit trail, and approval workflow before changing financial records."
        ]
      }
    ]
  },
  sources: {
    page: "sources",
    eyebrow: "Data Source And Lineage Research",
    title: "Local-source-first architecture with Treasury transparency, USSGL, and DoD source governance.",
    summary: "The Data Sources page should teach how raw files become governed analytic records and how those records later migrate to Neon, Data Broker-style validations, and public-source refreshes.",
    references: [commonReferences.dataTransparency, commonReferences.ussgl, commonReferences.fmr, commonReferences.usaspending],
    sections: [
      {
        title: "Source governance model",
        body: "Every parsed fact needs a lineage record before it becomes a dashboard, AI context item, or database row.",
        bullets: [
          "Inventory: path, source family, file type, fiscal year, agency, domain, size, modified time, parser status, and checksum/signature.",
          "Extract: parser version, extraction timestamp, row count, columns detected, validation result, rejected rows, and warning count.",
          "Normalize: canonical field names, data types, units, dollars/thousands conversion, fiscal-year handling, and source primary key.",
          "Validate: schema completeness, required fields, duplicate detection, referential checks, reasonableness tests, and reconciliation totals.",
          "Publish: API payload, dashboard chart, AI context, database table, refresh status, and audit trail."
        ]
      },
      {
        title: "Migration and automation playbook",
        body: "Move from local files to production data services in controlled stages.",
        bullets: [
          "Stage 1: local snapshot with source signature and generated gzip artifact for Vercel deployment.",
          "Stage 2: Neon schema for source_documents, budget_lines, award_transactions, audit_documents, findings, anomalies, and model_runs.",
          "Stage 3: ingestion jobs for DoD budget materials, USAspending downloads/API, Treasury Fiscal Data, GAO/OIG reports, and agency AFRs.",
          "Stage 4: validation jobs similar to Data Broker thinking: load, validate, publish, certify, reconcile.",
          "Stage 5: lineage API for every dashboard number and AI answer."
        ]
      }
    ]
  },
  solutions: {
    page: "solutions",
    eyebrow: "Solution Methodology",
    title: "DoD prototype solution catalog with policy-grounded model design.",
    summary: "Each solution tile should act like a miniature product: select source candidates, choose model mode, run analysis, inspect diagnostics, see feature impact, and produce an operational action.",
    references: [commonReferences.a11, commonReferences.a123, commonReferences.fmr, commonReferences.greenBook, commonReferences.dataTransparency],
    sections: [
      {
        title: "Solution design principles",
        body: "The gallery should combine research content, data selection, model diagnostics, and action queues.",
        bullets: [
          "Budget solution: aligns OMB A-11, DoD exhibit structure, FMR budget execution, and FY variance explainability.",
          "Anomaly solution: combines negative obligation, missing metadata, concentration, source drift, and amount outlier signals.",
          "Audit solution: turns A-123/Green Book concepts into control readiness, evidence sufficiency, and CAP workflow.",
          "FinOps solution: profiles recipient concentration, agency portfolio, action month, object class, and obligation lifecycle risk.",
          "Document solution: ranks PDF/XLSX/JSON candidates for extraction, snippets, table normalization, and grounded Q&A.",
          "Lineage solution: scores parser coverage, refresh risk, domain coverage, and database migration readiness."
        ]
      },
      {
        title: "What good model output should include",
        body: "For a credible federal finance prototype, model output must be explainable and auditable.",
        bullets: [
          "Diagnostics: training rows, source count, confidence, validation approach, and lift/segmentation result.",
          "Feature impact: ranked drivers such as account, scenario, recipient, document type, parser status, or control risk.",
          "Scored outputs: entity, score, value, evidence, and next action.",
          "Recommendations: operationally specific steps that an analyst, auditor, or data engineer can actually perform.",
          "Governance: model mode, selected data sources, target, horizon, source signature, and generated timestamp."
        ]
      }
    ]
  }
};
