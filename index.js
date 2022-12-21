const core = require("@actions/core");
const JiraApi = require("jira-client")

let jira, domain, username, password, jql, fieldName, fieldValue, appendValue;
(async () => {
    try {
        domain = core.getInput("domain");
        username = core.getInput("username");
        password = core.getInput("password");
        jql = core.getInput("jql");
        fieldValue = core.getInput("fieldValue");
        fieldName = core.getInput("fieldName");
        appendValue = core.getInput("appendValue") === "true" || core.getInput("appendValue") === true;

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
        searchAndUpdate(jql, fieldName, fieldValue, appendValue)
    } catch (error) {
        core.setFailed(error.message);
    }
})();

async function searchAndUpdate(jql, fieldName, fieldValue, appendValue) {
    const issues = await searchIssues(jql);
    for (let i = 0; i < issues.issues.length; i++) {
        const issue = issues.issues[i];
        updateIssue(issue, fieldName, fieldValue, appendValue);
    }
}

async function searchIssues(jql) {
    return await jira.searchJira(jql);
}

async function updateIssue(issue, fieldName, fieldValue, appendValue) {
    // FixVersion is an Object, not a simple string
    if (fieldName === "fixVersions") {
        // from e.g. TEST-1 get the project key --> TEST
        const projectKey = getProjectKey(issue.key);
        const projectId = await getProjectId(projectKey);
        const version = await getVersion(projectId, fieldValue);
        return await addVersion(issue, version.id);
    } else {
        if (appendValue) {
            const oldValue = issue["fields"][fieldName];
            if (!!oldValue) {
                fieldValue = oldValue + ", " + fieldValue;
            }
        }
        return await jira.updateIssue(issue.id, {
            fields: {
                [fieldName]: fieldValue
            }
        });
    }
}

async function getVersion(projectId, versionName) {
    const versions = await jira.getVersions(projectId);
    for (let i = 0; i < versions.length; i++) {
        const version = versions[i];
        if (version.name === versionName) {
            return version;
        }
    }
    return undefined;
}

async function addVersion(issue, versionId) {
    await jira.updateIssue(issue.id, {
        update: {
            fixVersions: [{"add": {id: versionId}}]
        }
    });
}

async function getProjectId(projectKey) {
    const project = await jira.getProject(projectKey);
    return project.id
}

function getProjectKey(issueKey) {
    return issueKey.substring(0, issueKey.indexOf("-"));
}

module.exports = searchAndUpdate;