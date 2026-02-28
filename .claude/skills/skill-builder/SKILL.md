---
name: skill-builder
description: Create a new Claude Code skill based on your description and requirements.
---

# Skill Builder

Create a new Claude Code skill from scratch based on your description and requirements.

## Behavior

1. Ask the user for the skill name (if not provided in kebab-case)
2. Ask for the skill description (one sentence summary)
3. Ask for background/problems/goals to achieve (context and motivation)
4. Generate the SKILL.md file with proper structure and documentation
5. Display the generated skill file for review
6. Confirm the user is satisfied before finalizing and committing

## Output

Generates a complete SKILL.md file with:

```markdown
---
name: { skill-name }
description: { description }
---

# {Skill Name}

{Full description of what the skill does}

## Behavior

1. {Step 1}
2. {Step 2}
   ...

## Supported Arguments/Modules

- {option 1}
- {option 2}

## Example Usage

\`\`\`
/{skill-name} arg1
/{skill-name} arg1 --flag
\`\`\`

## Implementation

{Clear implementation instructions with bash commands}

Always display:

- {Output summary points}
```

## Example Usage

```
/skill-builder                                    # interactive mode
/skill-builder my-feature-helper                  # with skill name
```

## Implementation

1. **Interactive mode**: Ask the user questions one by one to gather all requirements
2. **Parse input**: Extract skill name and any provided arguments
3. **Generate SKILL.md**: Create the skill file with proper frontmatter and structure
4. **Create directory**: If `.claude/skills/{skill-name}/` doesn't exist, create it
5. **Write file**: Write the generated SKILL.md to the correct location
6. **Review**: Display the generated file and ask for confirmation
7. **Finalize**: Once approved, the skill is ready to use

## Notes

- Skill names should be in kebab-case (e.g., `test-module`, `skill-builder`)
- Always use `.claude/skills/{skill-name}/SKILL.md` as the target path
- Generated skills should be practical, focused on a single task
- Include clear examples and implementation details for other AI assistants
- Ask for user confirmation before writing the file to disk
