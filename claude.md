# Gemeos

## Claude.md
/
This file provide guidance to claude code (claude.ai/code) when working with this code in this repository. 

## Development process
- A feature development starts with the requirement of the product manager, i.e. the claude code user. As second step, the project-manager and the business-engineer will engage in a question/asnwer session with the project manager to clarify any questions and remomve any ambiguity. Once the product manager has approved the feature description in text format, the development team - coordinated by the project-manager - will design the process at activity/task level, which can be translated into UI components, backend logic, etc. The process must be described with textual use case format with step, actor, input, system behavior, output. 
- once the process (in textual use case format) has been approved by the product manager, the project-manager will engage the team (the ux-designer) to create the corresponding first draft of the user interface, whose main objective is to give the project manager to provide a first feedback about the user flow. In this stage, the product manager can ask to implement the full-fledged UX-Design before moving ahead with the next development step. 
- once the first draft of the user interface is approved by the product manager, the project-manager will engage the development team (the various agents) to define the technical specificatons including database design, backend logic, any google cloud services, etc. 
- once the technical specifications are approved by the product manager, the project-manager will engage the team (the various agents) to kick off the development. 
- in the quality assurance phase, it must be ensured that every process step of a given developed feature is tested, including entering data in any designed form, click on save / create / update buttons and database inserts. The whole quality assurance phase must ensure that the expected results are met
- once the development is completed, the project-manager will request the product manager to review the results for the acceptance test. 
- Once the acceptance test is successful, the code will be committed to github / deployed. 

## Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md` and `/context/style-guide.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

## Comprehensive Design Review
Invoke the `design-reviewer" agent for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

## Design Principles
- Comprehensive design checklist in `/context/design-principles.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance


