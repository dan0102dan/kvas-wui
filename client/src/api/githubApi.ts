import axios from 'axios'

const githubApi = axios.create({
    baseURL: 'https://api.github.com',
})

export async function getLatestReleaseVersion(owner: string, repo: string): Promise<string> {
    const response = await githubApi.get(`/repos/${owner}/${repo}/releases/latest`)

    const version = response.data.tag_name.replace(/^v/, '')
    return version
}