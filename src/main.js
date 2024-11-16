const core = require('@actions/core')
// const { wait } = require('./wait')
const github = require('@actions/github')

async function run() {
  try {
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })
    const pr_number = core.getInput('pr_number', { required: true })
    const token = core.getInput('token', { required: true })

    const octokit = new github.getOctokit(token)

    const { data: changedFiles } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number
    })

    let diffData = {
      addition: 0,
      deletions: 0,
      changes: 0
    }

    diffData = changedFiles.reduce((acc, { additions, deletions }) => {
      acc.additions += additions
      acc.deletions += deletions
      acc.changes += additions + deletions
      return acc
    }, diffData)

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
        This PR #${pr_number} has : \n
        - ${diffData.additions} additions \n
        - ${diffData.deletions} deletions \n  
        - with a total of ${diffData.changes} changes.`
    })

    for (const file of changedFiles) {
      const fileExtention = file.filename.split('.').pop()
      let label = ''
      switch (fileExtention) {
        case 'md':
          label = 'markdown'
          break
        case 'js':
          label = 'javascript'
          break
        case 'json':
          label = 'json'
          break
        case 'yml':
          label = 'yaml'
          break
        case 'yaml':
          label = 'yaml'
          break
        default:
          label = 'noextension'
          break
      }

      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: pr_number,
        labels: [label]
      })
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
