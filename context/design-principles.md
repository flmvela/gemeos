# Gemeos Design Principles Checklist (Inspired by Leading LMS Platforms like Canvas, Docebo, and Brightspace)

## I. Core Design Philosophy & Strategy

*   [ ] **Learners & Educators First:** Prioritize the needs, cognitive load, and workflows of students and teachers in every design decision.
*   [ ] **Precision + Warmth:** Combine a polished, modern UI with an emotionally warm experience suited for educational contexts.
*   [ ] **Responsiveness & Feedback:** Design for instant visual and system feedback, especially during exercises or review actions.
*   [ ] **Clarity Over Complexity:** Avoid jargon, keep interfaces intuitive, and ensure that all instructional content is easy to understand.
*   [ ] **Frictionless Flows:** Help users accomplish goals with minimal steps — whether uploading material, reviewing AI suggestions, or practicing an exercise.
*   [ ] **Visual Consistency:** Use a coherent design language across student, teacher, and admin views.
*   [ ] **Inclusive by Design (WCAG AA+):** Ensure color contrast, keyboard navigation, and accessibility support are built-in.
*   [ ] **Guided Interactions:** Provide thoughtful defaults and contextual tips to guide novice users without overwhelming them.

## II. Design System Foundation (Tokens & Core Components)

*   [ ] **Color Palette:**
    *   [ ] **Brand Colors:** Primary blue/cyan gradient, accent yellow (learning focus), background neutrals.
    *   [ ] **Grayscale:** 7-step scale for text, backgrounds, dividers.
    *   [ ] **Semantic Colors:** Green (approved), Red (rejected/destructive), Yellow (pending), Blue (info).
    *   [ ] **Dark Mode:** Fully supported with accessible contrast.
    *   [ ] **WCAG Compliance:** All color pairs meet AA standards.

*   [ ] **Typography:**
    *   [ ] **Font Family:** Clean, modern sans-serif (e.g., Inter, Manrope).
    *   [ ] **Scale:** Titles (H1-H4), Paragraphs, UI Labels, Captions.
    *   [ ] **Weights:** Regular, Medium, SemiBold.
    *   [ ] **Line Height:** 1.5–1.6 for readability.

*   [ ] **Spacing Units:**
    *   [ ] **Base Unit:** 8px.
    *   [ ] **Scale:** 4, 8, 12, 16, 24, 32, 48, 64.

*   [ ] **Border Radii:**
    *   [ ] Inputs: 6px; Buttons: 8px; Cards/Modals: 12px.

*   [ ] **Core Components:**
    *   [ ] Buttons (Primary, Secondary, Ghost, Icon-only)
    *   [ ] Inputs (Text, Textarea, Select, Date, Range)
    *   [ ] Badges (Status tags: Approved, Pending, Rejected)
    *   [ ] Cards (Concepts, Exercises, Reviews)
    *   [ ] Tables (for learning items, review queue)
    *   [ ] Modals (confirmation, rejection reasons, examples)
    *   [ ] Navigation (Sidebar, Tabs)
    *   [ ] Progress Indicators (student practice, content loading)
    *   [ ] Avatars, Icons, Tooltips

## III. Layout, Visual Hierarchy & Structure

*   [ ] **12-Column Responsive Grid**
*   [ ] **Ample White Space:** Improves cognitive clarity, especially for learners.
*   [ ] **Clear Hierarchy:** Leverage typography, size, and positioning to direct attention.
*   [ ] **Sticky Navigation:** For key actions like Save, Approve, Reject.
*   [ ] **Dashboard Pattern:**
    *   [ ] Sidebar with icons + labels (Students, Domains, Reviews, Exercises)
    *   [ ] Topbar with profile, notifications, and AI status
    *   [ ] Main content with cards/tables/forms

*   [ ] **Mobile-First Responsiveness:** Especially important for student-facing flows.

## IV. Interaction Design & Animations

*   [ ] **Subtle Micro-Interactions:** Hover states, button presses, validation feedback.
*   [ ] **Loading States:** Spinners + Skeleton screens for AI-generated content.
*   [ ] **Transitions:** Smooth modals, inline expand/collapse.
*   [ ] **Keyboard Accessibility:** All inputs, actions must be navigable.

## V. Key Module Patterns

### A. Concept/Goal/Exercise Review
*   [ ] Status Tags: Suggested, Approved, Rejected.
*   [ ] Action Buttons: Approve, Reject, Edit (icon + label)
*   [ ] Metadata Display: Source (AI or Human), Created By, Timestamp.
*   [ ] Feedback Input: Text area for rejections with smart suggestions.
*   [ ] Bulk Review Support: Select multiple, batch actions.

### B. Student Progress Dashboard
*   [ ] Progress Rings/Bars for each domain or concept.
*   [ ] Completion badges for achievements.
*   [ ] Daily Practice Widget: Adaptive, streak-based design.
*   [ ] Feedback Logs: Show past exercises and scores.

### C. Content Authoring Interface
*   [ ] WYSIWYG Inputs: Markdown or rich-text editor for concepts/goals.
*   [ ] Relationship Picker: Assign prerequisites, related concepts.
*   [ ] Difficulty Slider: For teachers to mark expected difficulty.
*   [ ] Sequence Number Input: Define order within a concept path.

## VI. CSS & Styling Architecture

*   [ ] **Tailwind CSS (Utility-first):** Base config with design tokens.
*   [ ] **Figma Tokens Plugin:** Sync design + code spacing/colors/typography.
*   [ ] **Naming Convention:** Follow BEM if utility-first is not used.
*   [ ] **Dark Mode Support:** Tailwind dark variants used consistently.
*   [ ] **Modular CSS:** Grouped by feature or layout block.

## VII. Best Practices

*   [ ] **Iterate with Teachers & Students:** Validate flows with real users.
*   [ ] **Clear IA:** Menu and routing align with cognitive models of students/teachers.
*   [ ] **Accessibility:** Use semantic HTML, alt text, ARIA labels.
*   [ ] **Documentation:** Maintain component library docs and editor UX guides.
*   [ ] **Brand Voice:** Keep microcopy friendly, clear, supportive.
*   [ ] **Performance:** Optimize for fast load even on low-bandwidth student devices.

---

This checklist defines Gemeos' visual and interaction principles to guide development and ensure consistency across all modules.