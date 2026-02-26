# Troubleshoot Issue

Debug and diagnose a technical issue in the application.

## Steps

1. If a Sentry issue ID is provided, use the Sentry MCP to query error data
2. If chrome-devtools MCP is available, use it for runtime debugging
3. Analyze stack traces and error messages
4. Search the codebase for the affected code path
5. Identify the root cause
6. Ask the developer if related recent PRs via GitHub MCP for context should be checked
7. Suggest a fix with specific file and line references

## Output

Provide:

- **Error summary**: What is happening and where
- **Root cause**: Why it is happening
- **Affected code**: Files and line numbers
- **Suggested fix**: Specific code changes to resolve the issue
- **Reproduction steps**: Clear steps to reproduce the issue for a test user
- **Testing**: How to verify the fix works

If a GitHub issue exists, add clear steps to reproduce to the issue.
