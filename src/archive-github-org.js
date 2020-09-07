// import { request } from "@octokit/request"
const { request } = require("@octokit/request");
const { createAppAuth } = require("@octokit/auth-app");

const myToken = process.env.ARCHIVE_REPO_TOKEN;
console.log(myToken)
const authHeaders = request.defaults({
  headers: {
    authorization: `token: ${myToken}`,
  },
});

async function getAllUnarchivedOrgRepos(org) {
  try {
    const numRepos = await authHeaders('GET /orgs/:org', {
      org: org
    }).then(result => {
      return result.data.public_repos;
    });
    console.log(`There are a total of ${numRepos} repos in this organization`);
    let unarchivedRepos = [];
    for (let i=0; i<numRepos/100; ++i) {
      const result = await authHeaders('GET /orgs/:org/repos', {
          org: org,
          page: i+1,
          per_page: 100,
        })
      unarchivedRepos = unarchivedRepos.concat(result.data.filter(repo => {
        return !repo.archived;
      }));
    }
    console.log(`And ${unarchivedRepos.length} of them were unarchived.`);
    return unarchivedRepos;
  } catch(e) {
    console.error(e)
  }
}

async function archiveSingleRepo(org, repoName) {
  try {
    const result = await authHeaders('PATCH /repos/:org/:repo', {
      org: org,
      repo: repoName,
      archived: true
    });
    if (result.status == 200) {
      console.log(`Successfully archived ${repoName}.`);
      return repoName;
    } else {
      console.error(`Error archiving ${repoName}:`);
      console.error(result);
    }
  } catch(e) {
    console.error(e);
  }
}

async function archiveAllOrgRepos(org) {
  const repoList = await getAllUnarchivedOrgRepos(org);
  const repoNames = repoList.map(repo => {
    return repo.name;
  })
  console.log(repoNames);
  const archivedNames = repoNames.map(repoName => {
    const archivedName = archiveSingleRepo(org, repoName);
    return archivedName;
  });
  return archivedNames;
}

const archivedRepos = archiveAllOrgRepos('UMM-CSci-3601-F17');
archivedRepos.then(repoNames => {
  console.log(repoNames);
})

