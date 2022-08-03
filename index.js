const core = require("@actions/core");
const JiraApi = require("jira-client")

let jira, domain, username, password, jql, fieldName, fieldValue;
(async () => {
    try {
        domain = core.getInput("domain");
        username = core.getInput("username");
        password = core.getInput("password");
        jql = core.getInput("jql");
        fieldValue = core.getInput("fieldValue");
        fieldName = core.getInput("fieldName");

        if (!jql || !fieldName || !fieldValue) {
            core.setFailed(`Please provide jql, fieldName and fieldValue`);
            return;
        }

        // Initialize
        jira = new JiraApi({
            protocol: "https",
            host: domain,
            username: username,
            password: password,
        });
        searchAndUpdate(jql, fieldName, fieldValue)
    } catch (error) {
        core.setFailed(error.message);
    }
})();

async function searchAndUpdate(jql, fieldName, fieldValue) {
    const issues = await searchIssues(jql);
    for (let i = 0; i < issues.issues.length; i++) {
        const issue = issues.issues[i];
        updateIssue(issue, fieldName, fieldValue);
    }
}

async function searchIssues(jql) {
    return await jira.searchJira(jql);
}

async function updateIssue(issue, fieldName, fieldValue) {
    return await jira.updateIssue(issue.id, {
        fields: {
            [fieldName]: fieldValue
        }
    });
}
