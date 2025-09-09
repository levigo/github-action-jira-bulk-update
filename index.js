const core = require('@actions/core');
// const core = require("./mockCore.js");
const requestHelper = require('./requestHelper.js');

let domain, username, password, jql, fieldName, fieldValue, appendValue;
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

        searchAndUpdate(jql, fieldName, fieldValue, appendValue)
    } catch (error) {
        core.setFailed(error.message);
    }
})();

async function searchAndUpdate(jql, fieldName, fieldValue, appendValue) {
    const issues = await searchIssues(jql);
    for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        updateIssue(issue, fieldName, fieldValue, appendValue);
    }
}

async function searchIssues(jql) {
    const retVal = [];
    const issueRef = await requestHelper.getRequest(`/rest/api/3/search/jql?jql=${encodeURI(jql)}`);
    for (let i = 0; i < issueRef.issues.length; i++) {
        const issuePath = `/rest/api/3/issue/${issueRef.issues[i].id}`;
        const issue = await requestHelper.getRequest(issuePath);
        retVal.push(issue);
    }
    return retVal;
}

async function updateIssue(issue, fieldName, fieldValue, appendValue) {
    // FixVersion is an Object, not a simple string
    if (fieldName === "fixVersions") {
        // from e.g. TEST-1 get the project key --> TEST
        const projectKey = getProjectKey(issue.key);
        const projectId = await getProjectId(projectKey);
        let version = await getVersion(projectId, fieldValue);
        if (!version) {
            await createVersion(issue, fieldValue, projectId);
            version = await getVersion(projectId, fieldValue);
        }
        return await addVersion(issue, version.id);
    } else {
        if (appendValue) {
            const oldValue = issue["fields"][fieldName];
            if (!!oldValue) {
                fieldValue = oldValue + ", " + fieldValue;
            }
        }
        const bodyData = {
            "fields": {
                [fieldName]: fieldValue
            }
        }
        const putUpdateIssuePath = `/rest/api/3/issue/${issue.id}`;
        return await requestHelper.bodyRequest(putUpdateIssuePath, JSON.stringify(bodyData), 'PUT');

    }
}

async function getVersion(projectId, versionName) {
    const versions = await requestHelper.getRequest(`/rest/api/3/project/${projectId}/versions`);
    for (let i = 0; i < versions.length; i++) {
        const version = versions[i];
        if (version.name === versionName) {
            return version;
        }
    }
    return undefined;
}

/**
 * Make sure the version is not archived as it cannot be added to an issue if it is archived
 * @param issue
 * @param versionId
 * @returns {Promise<void>}
 */
async function addVersion(issue, versionId) {
    const bodyData = {
        update: {
            fixVersions: [{"add": {id: versionId}}]
        }
    }
    const putUpdateIssuePath = `/rest/api/3/issue/${issue.id}`;
    await requestHelper.bodyRequest(putUpdateIssuePath, JSON.stringify(bodyData), 'PUT');
}

async function createVersion(issue, versionName, projectId) {
    const bodyData = {
      "archived": false,
      "description": "Created by GitHub Action Jira Bulk Update",
      "name": versionName,
      "projectId": projectId,
      "released": false
    };
    const putUpdateIssuePath = `/rest/api/3/version`;
    await requestHelper.bodyRequest(putUpdateIssuePath, JSON.stringify(bodyData), 'POST');
}

async function getProjectId(projectKey) {
    const project = await requestHelper.getRequest(`/rest/api/3/project/${projectKey}`);
    return project.id
}

function getProjectKey(issueKey) {
    return issueKey.substring(0, issueKey.indexOf("-"));
}
