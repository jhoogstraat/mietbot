import { readFile, writeFile } from "fs/promises"

export { load, save }

type Job = {
  url: string
  channel: string
}

type JobList = Map<String, Job>

const file = 'jobs.json'

async function load(): Promise<JobList> {
  const raw = await readFile(file, "utf-8")
  return new Map(JSON.parse(raw))
}

function save(jobs: JobList): Promise<void> {
  return writeFile(file, JSON.stringify([...jobs]))
}
