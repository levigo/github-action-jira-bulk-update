# Jira bulk update multiple issues

The action will set the given field in Jira to the given value.


## Inputs
- `domain`: Domain name of the Jira cloud instance (e.g. your-domain.atlassian.net)
- `username`: Jira Username
- `password`: Jira Personal Access Token. Get it from [here](https://id.atlassian.com/manage-profile/security/api-tokens)
- `jql`: The JQL query to identify the issues to update
- `fieldName`: The name of the field to update (careful with custom fields)
- `fieldValue`: The value to set the field to
- `appendValue`: set to `true` if you want to append the value and not replace it

## Outputs
None


## Example usage
```yaml
uses: levigo/github-action-jira-bulk-update@v1.0.0
with:
  domain: "my-company.atlassian.net"
  username: "technical-user@company.net"
  password: "fmpUJkGhdKFvoTJclsZ03xw1"
  jql: "project IN (TEST, TEST2)"
  fieldName: "customfield_10069"
  fieldValue: "This is a test"
```

## Limitations

- Currently no complex fields are supported (except "fixVersion")
