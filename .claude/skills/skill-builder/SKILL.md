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
name: {skill-name}
description: {description}
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

1. **Gather input**: Get skill name (kebab-case), description, and background/goals
2. **Generate SKILL.md**: Create skill file with:
   - Frontmatter: name and description
   - Overview section explaining the skill
   - Behavior section with numbered steps (inferred from description/goals)
   - Example Usage section with command patterns
   - Implementation section with clear bash commands
3. **Create directory**: Generate `.claude/skills/{skill-name}/` if needed
4. **Review**: Display the generated SKILL.md to user
5. **Confirm & Commit**: Ask for approval, then write file and create git commit

## Notes

- Skill names must be in kebab-case (e.g., `test-module`, `skill-builder`)
- Target path: `.claude/skills/{skill-name}/SKILL.md`
- Skills should be focused on a single clear purpose
- Include practical examples for end users
- Provide clear implementation details (bash commands, tool usage) for AI assistants
- Always ask for user confirmation before writing to disk
