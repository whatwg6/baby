import { createRepository, type Repository } from "../storage/repository";

const repository = createRepository();

export async function exportAll(activeRepository: Repository = repository): Promise<string> {
  const data = await activeRepository.exportAll();

  return JSON.stringify(data, null, 2);
}
