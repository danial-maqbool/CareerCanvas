# Implemented Capability Inventory

This release contains **80 capability groups** listed below. A group is a coherent user workflow, not a count of buttons, checks, database tables, or template variants. Optional provider adapters are implemented but live provider operation is not certified; see [validation](VALIDATION.md). Resume document ingestion and direct uploaded-file ATS review are documented in [Resume Import & Direct ATS Review](RESUME_IMPORT.md).

1. Dashboard with live resume, application, interview, offer, and profile metrics.
2. Dashboard widget reordering, visibility, width, and reset.
3. Visual resume library with document thumbnails and metadata.
4. Resume naming, renaming, and target roles.
5. Resume creation wizard with purpose and template selection.
6. Profile-content selection when creating resumes.
7. Independent resume snapshots and customized content.
8. Resume duplication.
9. Resume archive and archived library.
10. Resume deletion with confirmation.
11. Primary resume selection.
12. Twelve distinct professional template layouts.
13. Template filters and previews with current career data.
14. Content-preserving template switching.
15. Three-panel visual editor.
16. Inline visible text editing.
17. ATS-safe rich summary formatting with bold, italic, and lists.
18. Drag-and-drop section ordering.
19. Drag-and-drop experience bullet ordering.
20. Keyboard section and bullet reordering.
21. Explicit section controls with labeled Show/Hide, Up, and Down actions plus drag handles.
22. Custom section creation and duplication.
23. Personal contact editing and field visibility.
24. Resume-local content item editing and removal.
25. Achievement insertion from the reusable profile library.
26. Font family and body-size customization with both sliders and exact numeric values.
27. Line height, page margin, section, and bullet spacing with quick Compact, Comfortable, ATS-safe, and Reset actions.
28. Primary, secondary, and text colors with presets.
29. Heading, alignment, and date styling.
30. Skills columns and separators.
31. A4 and US Letter document sizing.
32. Zoom, fit-width, and fit-page controls.
33. Measured pagination and visible page boundaries.
34. Overflow warnings and continuation layout.
35. Bounded Fit to One Page without deleting content.
36. Panel-free resume preview.
37. Debounced autosave with saved/error status and revision conflicts.
38. Recent undo/redo with keyboard shortcuts.
39. Selectable-text PDF export with hyperlinks.
40. Editable DOCX export with native bullets and links.
41. Individual resume JSON export and validated import.
42. Named immutable resume versions.
43. Added/removed/modified version comparison.
44. Version restoration retaining newer snapshots and a safety version.
45. Reusable Career Profile and completion guidance.
46. Experience management with dates, technologies, and achievement bullets.
47. Education management with courses, honors, and GPA.
48. Reusable categorized skills and learning/proficiency metadata.
49. Project management with technologies, achievements, and URLs.
50. Certification management with issuer and credential metadata.
51. Publication management with authors, venue, citation, and links.
52. Language management.
53. References stored separately and excluded by default.
54. Visual portfolio records and links.
55. Reviewed public GitHub repository metadata import.
56. Achievement library with tags and metrics.
57. Deterministic bullet-quality feedback.
58. Sixteen-check native ATS readiness model with partial credit, category scores, critical score caps, measurable/action-oriented achievement checks, date and density checks, and an explicit ATS-safe layout repair action.
59. Job-description extraction and transparent match components.
60. Matched, missing, related, and existing-profile evidence views.
61. Reviewed tailored resume copies preserving originals.
62. Optional Gemini rewrite adapter with per-request external consent.
63. Optional localhost Ollama rewrite adapter.
64. Original/suggested factual-change review with accept/reject/edit.
65. Cover-letter creation, naming, duplication, archive, and versions.
66. Cover-letter PDF/DOCX export and document associations.
67. Ten-stage application Kanban with pointer and select controls.
68. Application details, resume versions, timeline, and history.
69. Follow-ups, deadlines, notes, tasks, and application contacts.
70. Reusable contact management.
71. Interview scheduling, logistics, and preparation checklists.
72. Linked STAR stories and categorized interview question bank.
73. Career goals with milestones, target dates, tags, and progress.
74. Real-state career analytics and observed outcomes by resume.
75. Global search, Ctrl+K command palette, and quick-add menu.
76. Light/dark/system themes and responsive editor drawers.
77. Workspace backup/restore, reusable tags, and major-action audit events.
78. Explicit first-run fictional demo workspace with populated documents and activity.
79. Reviewed PDF, DOCX, and TXT resume import into Career Profile with local text extraction, field confidence/source evidence, duplicate detection, per-record keep/replace/merge/new choices, and import audit entries.
80. Direct uploaded-resume ATS review with the same strict scoring policy, extracted-text preview, document-structure inspection, selectable-text/image-based warnings, detected links, standard-section checks, content-quality checks, and one-click creation of an editable CareerCanvas resume.

Photo support and automatic OCR for scanned/image-only resumes are not included. Scanned PDFs are detected and reported with a local-OCR recommendation. Hosted multi-user authentication and guaranteed AI factual equivalence are not offered.
